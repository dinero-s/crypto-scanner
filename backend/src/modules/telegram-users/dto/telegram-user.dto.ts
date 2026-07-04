import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Авторизация через Telegram WebApp initData */
export class TelegramAuthDto {
    @ApiProperty({ description: 'Telegram WebApp initData (signed)' })
    @IsString()
    initData: string;
}

/** Обновление профиля Telegram-пользователя */
export class UpdateTelegramUserDto {
    @ApiPropertyOptional({ description: 'Username (@handle)' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ description: 'Отображаемое имя' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({ description: 'Фамилия' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({ description: 'Язык интерфейса (ru, en)' })
    @IsOptional()
    @IsString()
    languageCode?: string;
}

/** Ответ профиля */
export class TelegramUserProfileDto {
    @ApiProperty({ description: 'Telegram user ID' })
    telegramId: string;

    @ApiProperty({ description: 'Статус подписки' })
    subscriptionStatus: string;

    @ApiPropertyOptional({ description: 'Username' })
    username?: string;
}
