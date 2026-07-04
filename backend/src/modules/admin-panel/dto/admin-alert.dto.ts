import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
    AdminAlertChannel,
    MarketplaceType,
} from '../enums/admin-panel.enum';
import { AlertEventStatus } from 'src/modules/ozon/constants/ozon.enums';
import { OzonSeverity } from 'src/modules/ozon/constants/ozon.enums';

export class FilterAdminAlertsDto {
    @ApiPropertyOptional({ description: 'Страница', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Лимит', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({ description: 'Маркетплейс', enum: MarketplaceType })
    @IsOptional()
    @IsEnum(MarketplaceType)
    marketplace?: MarketplaceType;

    @ApiPropertyOptional({ description: 'ID пользователя' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: 'ID подключения' })
    @IsOptional()
    @IsString()
    connectionId?: string;

    @ApiPropertyOptional({ description: 'Канал', enum: AdminAlertChannel })
    @IsOptional()
    @IsEnum(AdminAlertChannel)
    channel?: AdminAlertChannel;

    @ApiPropertyOptional({ description: 'Статус' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ description: 'Severity', enum: OzonSeverity })
    @IsOptional()
    @IsEnum(OzonSeverity)
    severity?: OzonSeverity;

    @ApiPropertyOptional({ description: 'Дата от (ISO)' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Дата до (ISO)' })
    @IsOptional()
    @IsString()
    dateTo?: string;
}

export class AdminAlertListItemDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: 'Дата' })
    createdAt: string;

    @ApiProperty({ description: 'Маркетплейс' })
    marketplace: MarketplaceType;

    @ApiProperty({ description: 'ID пользователя' })
    userId: string;

    @ApiProperty({ description: 'Email пользователя' })
    userEmail: string;

    @ApiPropertyOptional({ description: 'ID подключения' })
    connectionId?: string;

    @ApiProperty({ description: 'Канал', enum: AdminAlertChannel })
    channel: AdminAlertChannel;

    @ApiProperty({ description: 'Статус' })
    status: string;

    @ApiProperty({ description: 'Severity' })
    severity: string;

    @ApiProperty({ description: 'Сообщение' })
    message: string;

    @ApiPropertyOptional({ description: 'Ошибка' })
    errorMessage?: string;

    @ApiPropertyOptional({ description: 'Product ID' })
    relatedProductId?: string;

    @ApiPropertyOptional({ description: 'Recommendation ID' })
    relatedRecommendationId?: string;
}

export class AdminAlertDetailDto extends AdminAlertListItemDto {
    @ApiPropertyOptional({ description: 'Sanitized payload' })
    payload?: Record<string, unknown>;
}
