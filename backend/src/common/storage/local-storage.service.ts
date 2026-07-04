import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { dirname, resolve } from 'path';

export interface LocalFileMetadata {
    ContentType?: string;
    ContentLength?: number;
    LastModified?: Date;
    ETag?: string;
}

/** Сервис сохранения файлов на локальный диск */
@Injectable()
export class LocalStorageService {
    private readonly localStoragePath: string;
    private readonly publicBaseUrl: string;

    constructor(private configService: ConfigService) {
        const appRoot = process.cwd();
        this.localStoragePath = resolve(
            appRoot,
            this.configService.get<string>('MEDIA_LOCAL_PATH') ?? 'uploads/media',
        );
        this.publicBaseUrl =
            this.configService.get<string>('SERVER_URL') ?? 'http://localhost:4001';
    }

    /** Абсолютный путь к корню локального хранилища */
    getBasePath(): string {
        return this.localStoragePath;
    }

    /** Абсолютный путь к файлу по ключу */
    getLocalPath(key: string): string {
        const normalizedKey = key.replace(/^\/+/, '');
        const resolvedPath = resolve(this.localStoragePath, normalizedKey);
        if (!resolvedPath.startsWith(this.localStoragePath)) {
            throw new Error('Некорректный ключ файла');
        }
        return resolvedPath;
    }

    /** URL для потоковой отдачи файла (через API) */
    getStreamUrl(key: string): string {
        const safeBaseUrl = this.publicBaseUrl.replace(/\/$/, '');
        const encodedParts = key
            .split('/')
            .map(part => encodeURIComponent(part))
            .join('/');
        return `${safeBaseUrl}/uploads/media/${encodedParts}`;
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

    /** Сохраняет файл на диск и возвращает ключ */
    async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
        const localPath = this.getLocalPath(key);
        await fs.mkdir(dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, file.buffer);
        return key;
    }

    /** Возвращает поток файла по ключу */
    async getFileStream(key: string): Promise<Readable> {
        const localPath = this.getLocalPath(key);
        await fs.access(localPath);
        return createReadStream(localPath);
    }

    /** Возвращает поток части файла по диапазону байт */
    async getFileStreamWithRange(
        key: string,
        start: number,
        end: number,
    ): Promise<Readable> {
        const localPath = this.getLocalPath(key);
        await fs.access(localPath);
        return createReadStream(localPath, { start, end });
    }

    /** Возвращает метаданные файла */
    async getFileMetadata(key: string): Promise<LocalFileMetadata> {
        const localPath = this.getLocalPath(key);
        const stat = await fs.stat(localPath);
        const ext = key.split('.').pop()?.toLowerCase() ?? '';
        return {
            ContentType: this.resolveMimeType(ext),
            ContentLength: stat.size,
            LastModified: stat.mtime,
            ETag: '',
        };
    }

    /** Удаляет один файл по ключу */
    async deleteFile(key: string): Promise<void> {
        const localPath = this.getLocalPath(key);
        await fs.rm(localPath, { force: true });
    }

    /** Удаляет несколько файлов */
    async deleteFiles(keys: string[]): Promise<void> {
        await Promise.all(
            keys.map(async k => {
                const localPath = this.getLocalPath(k);
                await fs.rm(localPath, { force: true });
            }),
        );
    }

    /** URL для доступа к файлу (совместимость с getSignedUrl; expiresIn игнорируется для local) */
    async getSignedUrl(key: string, _expiresIn = 3600): Promise<string> {
        void _expiresIn;
        return this.getStreamUrl(key);
    }
}
