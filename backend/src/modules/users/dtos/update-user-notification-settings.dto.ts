import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/** Частичное обновление настроек уведомлений (экран настроек) */
export class UpdateUserNotificationSettingsDto {
    @ApiPropertyOptional({ description: 'Push-уведомления' })
    @IsOptional()
    @IsBoolean()
    pushNotifications?: boolean;

    @ApiPropertyOptional({ description: 'E-mail рассылка (новости и предложения)' })
    @IsOptional()
    @IsBoolean()
    emailNewsletter?: boolean;

    @ApiPropertyOptional({ description: 'Звуковые оповещения при уведомлениях' })
    @IsOptional()
    @IsBoolean()
    notificationSound?: boolean;
}
