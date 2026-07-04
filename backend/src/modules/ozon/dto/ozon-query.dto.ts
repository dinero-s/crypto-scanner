import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';
import { AlertEventType, OzonSeverity } from '../constants/ozon.enums';

/** DTO тестового уведомления */
export class TestAlertDto {
    @ApiProperty({ description: 'Тип алерта', enum: AlertEventType })
    @IsEnum(AlertEventType)
    type: AlertEventType;

    @ApiProperty({ description: 'Серьёзность', enum: OzonSeverity })
    @IsEnum(OzonSeverity)
    severity: OzonSeverity;

    @ApiProperty({ description: 'ID подключения (опционально)', required: false })
    @IsMongoId()
    @IsOptional()
    connectionId?: string;

    @ApiProperty({ description: 'Сообщение', required: false })
    @IsOptional()
    message?: string;
}

/** DTO фильтра алертов */
export class ListAlertsQueryDto {
    @ApiProperty({ description: 'Статус', required: false })
    @IsOptional()
    status?: string;
}

/** DTO фильтра товаров */
export class ListProductsQueryDto {
    @ApiProperty({ description: 'ID подключения', required: false })
    @IsMongoId()
    @IsOptional()
    connectionId?: string;

    @ApiProperty({ description: 'Поиск по названию / offerId / productId', required: false })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ description: 'Только без остатков', required: false })
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    noStock?: boolean;

    @ApiProperty({ description: 'Только с активными рекомендациями Profit Audit', required: false })
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    hasRecommendations?: boolean;

    @ApiProperty({ description: 'Только с алертами по товару', required: false })
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    hasAlerts?: boolean;

    @ApiProperty({ description: 'Страница', required: false, default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @ApiProperty({ description: 'Лимит', required: false, default: 50 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    @IsOptional()
    limit?: number;

    @ApiProperty({
        description: 'Сортировка',
        enum: ['price', 'stock', 'updatedAt'],
        required: false,
        default: 'updatedAt',
    })
    @IsEnum(['price', 'stock', 'updatedAt'])
    @IsOptional()
    sortBy?: 'price' | 'stock' | 'updatedAt';

    @ApiProperty({ description: 'Порядок сортировки', enum: ['asc', 'desc'], required: false })
    @IsEnum(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc';
}

/** DTO запуска синхронизации */
export class TriggerSyncDto {
    @ApiProperty({ description: 'Тип синхронизации', required: false })
    @IsOptional()
    syncType?: 'full' | 'products' | 'prices' | 'stocks' | 'orders';
}
