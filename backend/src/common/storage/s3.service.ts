import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { dirname, resolve } from 'path';

export interface S3FileMetadata {
    ContentType?: string;
    ContentLength?: number;
    LastModified?: Date;
    ETag?: string;
}

/** Сервис для работы с S3 или локальным диском (загрузка видео, медиа) */
@Injectable()
export class S3Service {
    private s3Client: S3Client | null;
    private bucket: string | null;
    private readonly isS3Configured: boolean;
    private readonly storageDriver: 'local' | 's3';
    private readonly localStoragePath: string;
    private readonly publicBaseUrl: string;

    constructor(private configService: ConfigService) {
        const envStorageDriver = this.configService.get<string>(
            'MEDIA_STORAGE_DRIVER'
        );
        this.storageDriver = envStorageDriver === 's3' ? 's3' : 'local';
        const appRoot = process.cwd();
        this.localStoragePath = resolve(
            appRoot,
            this.configService.get<string>('MEDIA_LOCAL_PATH') ?? 'uploads/media'
        );
        this.publicBaseUrl =
            this.configService.get<string>('SERVER_URL') ??
            'http://localhost:4001';

        const region = this.configService.get<string>('AWS_S3_REGION');
        const endpointRaw = this.configService.get<string>('AWS_S3_ENDPOINT');
        const accessKeyId = this.configService.get<string>('AWS_S3_CREDENTIAL_KEY');
        const secretAccessKey = this.configService.get<string>(
            'AWS_S3_CREDENTIAL_SECRET'
        );
        const bucket = this.configService.get<string>('AWS_S3_BUCKET');

        const hasRegion = typeof region === 'string' && region.length > 0;
        const hasAccessKey =
            typeof accessKeyId === 'string' && accessKeyId.length > 0;
        const hasSecretKey =
            typeof secretAccessKey === 'string' && secretAccessKey.length > 0;
        const hasBucket = typeof bucket === 'string' && bucket.length > 0;

        this.isS3Configured = hasRegion && hasAccessKey && hasSecretKey && hasBucket;

        if (!this.isS3Configured) {
            this.s3Client = null;
            this.bucket = null;
            return;
        }

        const endpoint =
            typeof endpointRaw === 'string' && endpointRaw.trim().length > 0
                ? endpointRaw
                : undefined;

        this.s3Client = new S3Client({
            region,
            endpoint,
            forcePathStyle: true,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.bucket = bucket;
    }

    private ensureS3Configured(): void {
        if (!this.isS3Configured || !this.s3Client || !this.bucket) {
            throw new InternalServerErrorException(
                'S3 хранилище не настроено (проверьте AWS_S3_REGION, AWS_S3_BUCKET и ключи доступа)',
            );
        }
    }

    private resolveLocalPath(key: string): string {
        const normalizedKey = key.replace(/^\/+/, '');
        const resolvedPath = resolve(this.localStoragePath, normalizedKey);
        if (!resolvedPath.startsWith(this.localStoragePath)) {
            throw new Error('Некорректный ключ файла');
        }
        return resolvedPath;
    }

    private resolveMimeType(ext: string): string {
        const map: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
            gif: 'image/gif',
            svg: 'image/svg+xml',
            avif: 'image/avif',
            mp4: 'video/mp4',
            webm: 'video/webm',
            ogg: 'video/ogg',
            avi: 'video/x-msvideo',
            mov: 'video/quicktime',
            mkv: 'video/x-matroska',
            flv: 'video/x-flv',
            wmv: 'video/x-ms-wmv',
            m4v: 'video/x-m4v',
            '3gp': 'video/3gpp',
            m3u8: 'application/vnd.apple.mpegurl',
            ts: 'video/mp2t',
        };
        return map[ext] ?? 'application/octet-stream';
    }

    /** Загружает файл в S3 или на локальный диск и возвращает ключ */
    async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
        if (this.storageDriver === 'local') {
            const localPath = this.resolveLocalPath(key);
            await fs.mkdir(dirname(localPath), { recursive: true });
            await fs.writeFile(localPath, file.buffer);
            return key;
        }

        this.ensureS3Configured();

        const command = new PutObjectCommand({
            Bucket: this.bucket as string,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await (this.s3Client as S3Client).send(command);
        return key;
    }

    /** Возвращает поток файла по ключу */
    async getFileStream(key: string): Promise<Readable> {
        if (this.storageDriver === 'local') {
            const localPath = this.resolveLocalPath(key);
            await fs.access(localPath);
            return createReadStream(localPath);
        }

        this.ensureS3Configured();

        const command = new GetObjectCommand({
            Bucket: this.bucket as string,
            Key: key,
        });

        const response = await (this.s3Client as S3Client).send(command);
        return response.Body as Readable;
    }

    /** Возвращает поток части файла по диапазону байт */
    async getFileStreamWithRange(
        key: string,
        start: number,
        end: number
    ): Promise<Readable> {
        if (this.storageDriver === 'local') {
            const localPath = this.resolveLocalPath(key);
            await fs.access(localPath);
            return createReadStream(localPath, {
                start,
                end,
            });
        }

        this.ensureS3Configured();

        const command = new GetObjectCommand({
            Bucket: this.bucket as string,
            Key: key,
            Range: `bytes=${start}-${end}`,
        });

        const response = await (this.s3Client as S3Client).send(command);
        return response.Body as Readable;
    }

    /** Возвращает метаданные объекта в хранилище */
    async getFileMetadata(key: string): Promise<S3FileMetadata> {
        if (this.storageDriver === 'local') {
            const localPath = this.resolveLocalPath(key);
            const stat = await fs.stat(localPath);
            const ext = key.split('.').pop()?.toLowerCase() ?? '';

            return {
                ContentType: this.resolveMimeType(ext),
                ContentLength: stat.size,
                LastModified: stat.mtime,
                ETag: '',
            };
        }

        this.ensureS3Configured();

        const command = new HeadObjectCommand({
            Bucket: this.bucket as string,
            Key: key,
        });

        const response = await (this.s3Client as S3Client).send(command);
        return {
            ContentType: response.ContentType,
            ContentLength: response.ContentLength,
            LastModified: response.LastModified,
            ETag: response.ETag,
        };
    }

    /** Удаляет один файл по ключу */
    async deleteFile(key: string): Promise<void> {
        if (this.storageDriver === 'local') {
            const localPath = this.resolveLocalPath(key);
            await fs.rm(localPath, { force: true });
            return;
        }

        this.ensureS3Configured();

        const command = new DeleteObjectCommand({
            Bucket: this.bucket as string,
            Key: key,
        });

        await (this.s3Client as S3Client).send(command);
    }

    /** Удаляет несколько файлов за один запрос */
    async deleteFiles(keys: string[]): Promise<void> {
        if (this.storageDriver === 'local') {
            await Promise.all(
                keys.map(async k => {
                    const localPath = this.resolveLocalPath(k);
                    await fs.rm(localPath, { force: true });
                }),
            );
            return;
        }

        this.ensureS3Configured();

        const command = new DeleteObjectsCommand({
            Bucket: this.bucket as string,
            Delete: {
                Objects: keys.map(k => ({ Key: k })),
            },
        });
        await (this.s3Client as S3Client).send(command);
    }

    /** Строит подписанный URL или локальный URL для скачивания файла */
    async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
        if (this.storageDriver === 'local') {
            const safeBaseUrl = this.publicBaseUrl.replace(/\/$/, '');
            const encodedParts = key
                .split('/')
                .map(part => encodeURIComponent(part))
                .join('/');

            return `${safeBaseUrl}/api/media/${encodedParts}`;
        }

        this.ensureS3Configured();

        const command = new GetObjectCommand({
            Bucket: this.bucket as string,
            Key: key,
        });

        return getSignedUrl(this.s3Client, command, { expiresIn });
    }
}
