import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';

export interface StorageFileMetadata {
    ContentType?: string;
    ContentLength?: number;
    LastModified?: Date;
    ETag?: string;
}

/**
 * Фасад хранилища: по умолчанию — локальный диск.
 * S3 временно заглушен (MEDIA_STORAGE_DRIVER=s3 приведёт к ошибке).
 */
@Injectable()
export class StorageService {
    private readonly driver: 'local' | 's3';

    constructor(
        private readonly configService: ConfigService,
        private readonly localStorage: LocalStorageService,
    ) {
        const envDriver = this.configService.get<string>('MEDIA_STORAGE_DRIVER');
        this.driver = envDriver === 's3' ? 's3' : 'local';
    }

    /** Абсолютный путь к файлу на диске (только для local) */
    getLocalPath(key: string): string {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: localPath доступен только для локального хранилища');
        }
        return this.localStorage.getLocalPath(key);
    }

    /** URL для потоковой отдачи файла */
    getStreamUrl(key: string): string {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: используйте MEDIA_STORAGE_DRIVER=local');
        }
        return this.localStorage.getStreamUrl(key);
    }

    /** Загружает файл и возвращает ключ */
    async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: используйте MEDIA_STORAGE_DRIVER=local');
        }
        return this.localStorage.uploadFile(file, key);
    }

    /** Возвращает поток файла */
    async getFileStream(key: string) {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: используйте MEDIA_STORAGE_DRIVER=local');
        }
        return this.localStorage.getFileStream(key);
    }

    /** Возвращает поток части файла по диапазону */
    async getFileStreamWithRange(key: string, start: number, end: number) {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: используйте MEDIA_STORAGE_DRIVER=local');
        }
        return this.localStorage.getFileStreamWithRange(key, start, end);
    }

    /** Возвращает метаданные файла */
    async getFileMetadata(key: string): Promise<StorageFileMetadata> {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: используйте MEDIA_STORAGE_DRIVER=local');
        }
        return this.localStorage.getFileMetadata(key);
    }

    /** Удаляет файл */
    async deleteFile(key: string): Promise<void> {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: используйте MEDIA_STORAGE_DRIVER=local');
        }
        return this.localStorage.deleteFile(key);
    }

    /** Удаляет несколько файлов */
    async deleteFiles(keys: string[]): Promise<void> {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: используйте MEDIA_STORAGE_DRIVER=local');
        }
        return this.localStorage.deleteFiles(keys);
    }

    /** URL для доступа к файлу */
    async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
        if (this.driver === 's3') {
            throw new Error('S3 заглушен: используйте MEDIA_STORAGE_DRIVER=local');
        }
        return this.localStorage.getSignedUrl(key, expiresIn ?? 3600);
    }
}
