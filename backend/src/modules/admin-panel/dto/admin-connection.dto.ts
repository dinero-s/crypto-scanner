import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
    ConnectionHealthStatus,
    MarketplaceType,
} from '../enums/admin-panel.enum';
import { OzonConnectionStatus } from 'src/modules/ozon/constants/ozon.enums';

export class FilterAdminConnectionsDto {
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

    @ApiPropertyOptional({ description: 'Статус', enum: OzonConnectionStatus })
    @IsOptional()
    @IsEnum(OzonConnectionStatus)
    status?: OzonConnectionStatus;

    @ApiPropertyOptional({ description: 'Health status', enum: ConnectionHealthStatus })
    @IsOptional()
    @IsEnum(ConnectionHealthStatus)
    healthStatus?: ConnectionHealthStatus;

    @ApiPropertyOptional({ description: 'ID пользователя' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: 'Поиск по названию' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Last sync от (ISO)' })
    @IsOptional()
    @IsString()
    lastSyncFrom?: string;

    @ApiPropertyOptional({ description: 'Last sync до (ISO)' })
    @IsOptional()
    @IsString()
    lastSyncTo?: string;
}

export class AdminConnectionListItemDto {
    @ApiProperty({ description: 'ID подключения' })
    id: string;

    @ApiProperty({ description: 'Маркетплейс', enum: MarketplaceType })
    marketplace: MarketplaceType;

    @ApiProperty({ description: 'ID пользователя' })
    userId: string;

    @ApiProperty({ description: 'Email пользователя' })
    userEmail: string;

    @ApiProperty({ description: 'Название подключения' })
    connectionName: string;

    @ApiProperty({ description: 'Статус' })
    status: string;

    @ApiProperty({ description: 'Health status', enum: ConnectionHealthStatus })
    healthStatus: ConnectionHealthStatus;

    @ApiPropertyOptional({ description: 'Последняя синхронизация' })
    lastSyncAt?: string;

    @ApiProperty({ description: 'Кол-во товаров' })
    productsCount: number;

    @ApiProperty({ description: 'Кол-во конкурентов' })
    competitorsCount: number;

    @ApiProperty({ description: 'Кол-во рекомендаций' })
    recommendationsCount: number;

    @ApiProperty({ description: 'Кол-во алертов' })
    alertsCount: number;

    @ApiProperty({ description: 'Кол-во ошибок' })
    errorsCount: number;

    @ApiPropertyOptional({ description: 'Дата создания' })
    createdAt?: string;
}

export class AdminConnectionDetailDto {
    @ApiProperty({ description: 'ID подключения' })
    id: string;

    @ApiProperty({ description: 'Маркетплейс' })
    marketplace: MarketplaceType;

    @ApiProperty({ description: 'Название' })
    connectionName: string;

    @ApiProperty({ description: 'Masked Client-Id' })
    maskedClientId: string;

    @ApiProperty({ description: 'Статус' })
    status: string;

    @ApiProperty({ description: 'Health status' })
    healthStatus: ConnectionHealthStatus;

    @ApiPropertyOptional({ description: 'Last sync' })
    lastSyncAt?: string;

    @ApiProperty({ description: 'Products count' })
    productsCount: number;

    @ApiProperty({ description: 'Competitors count' })
    competitorsCount: number;

    @ApiProperty({ description: 'Recommendations count' })
    recommendationsCount: number;

    @ApiProperty({ description: 'Alerts count' })
    alertsCount: number;

    @ApiProperty({ description: 'Errors count' })
    errorsCount: number;

    @ApiPropertyOptional({ description: 'Created at' })
    createdAt?: string;

    @ApiProperty({ description: 'User info' })
    user: { id: string; email: string; name: string };

    @ApiProperty({ description: 'Health summary' })
    healthSummary: { lastCheckAt?: string; status?: string };

    @ApiProperty({ description: 'Last sync summary' })
    lastSyncSummary: { action?: string; status?: string; at?: string };

    @ApiProperty({ description: 'Products sync status' })
    productsSyncStatus: { count: number };

    @ApiProperty({ description: 'Reports sync status' })
    reportsSyncStatus: { available: boolean };

    @ApiProperty({ description: 'Competitors sync status' })
    competitorsSyncStatus: { count: number };

    @ApiProperty({ description: 'Alerts summary' })
    alertsSummary: { count: number };

    @ApiProperty({ description: 'Recommendations summary' })
    recommendationsSummary: { count: number };

    @ApiProperty({ description: 'Audit summary' })
    auditSummary: Array<{
        id: string;
        action: string;
        status: string;
        createdAt?: string;
    }>;

    @ApiProperty({ description: 'Compliance summary' })
    complianceSummary: Array<{
        id: string;
        decision: string;
        endpoint?: string;
        blocked: boolean;
        createdAt?: string;
    }>;
}
