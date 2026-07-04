import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { StorageService } from './storage.service';

/** Модуль хранилища: по умолчанию локальный диск, S3 заглушен */
@Module({
    imports: [ConfigModule],
    providers: [LocalStorageService, StorageService],
    exports: [StorageService],
})
export class StorageModule {}
