import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { TelegramUserEntity, TelegramUserSchema } from './entities/telegram-user.entity';
import { TelegramUsersRepository } from './repositories/telegram-users.repository';
import { TelegramUsersService } from './services/telegram-users.service';

/** Модуль пользователей Telegram Mini App */
@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature(
            [{ name: TelegramUserEntity.name, schema: TelegramUserSchema }],
            DATABASE_CONNECTION_NAME,
        ),
    ],
    controllers: [],
    providers: [TelegramUsersRepository, TelegramUsersService],
    exports: [TelegramUsersRepository, TelegramUsersService],
})
export class TelegramUsersModule {}
