import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
    AvailabilityStatus,
    MarketplaceType,
} from '../enums/admin-panel.enum';
import {
    RecommendationStatus,
    RecommendationType,
    OzonSeverity,
} from 'src/modules/ozon/constants/ozon.enums';

export class FilterAdminRecommendationsDto {
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

    @ApiPropertyOptional({ description: 'Product ID' })
    @IsOptional()
    @IsString()
    productId?: string;

    @ApiPropertyOptional({ description: 'Тип', enum: RecommendationType })
    @IsOptional()
    @IsEnum(RecommendationType)
    type?: RecommendationType;

    @ApiPropertyOptional({ description: 'Severity', enum: OzonSeverity })
    @IsOptional()
    @IsEnum(OzonSeverity)
    severity?: OzonSeverity;

    @ApiPropertyOptional({ description: 'Статус', enum: RecommendationStatus })
    @IsOptional()
    @IsEnum(RecommendationStatus)
    status?: RecommendationStatus;

    @ApiPropertyOptional({ description: 'Availability', enum: AvailabilityStatus })
    @IsOptional()
    @IsEnum(AvailabilityStatus)
    availabilityStatus?: AvailabilityStatus;

    @ApiPropertyOptional({ description: 'Дата от (ISO)' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Дата до (ISO)' })
    @IsOptional()
    @IsString()
    dateTo?: string;
}

export class AdminRecommendationListItemDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: 'Дата' })
    createdAt: string;

    @ApiProperty({ description: 'Маркетплейс' })
    marketplace: MarketplaceType;

    @ApiProperty({ description: 'ID пользователя' })
    userId: string;

    @ApiProperty({ description: 'Email' })
    userEmail: string;

    @ApiPropertyOptional({ description: 'ID подключения' })
    connectionId?: string;

    @ApiPropertyOptional({ description: 'Product ID' })
    productId?: string;

    @ApiPropertyOptional({ description: 'Product name' })
    productName?: string;

    @ApiProperty({ description: 'Тип' })
    type: string;

    @ApiProperty({ description: 'Severity' })
    severity: string;

    @ApiProperty({ description: 'Статус' })
    status: string;

    @ApiProperty({ description: 'Availability', enum: AvailabilityStatus })
    availabilityStatus: AvailabilityStatus;

    @ApiProperty({ description: 'Title' })
    title: string;

    @ApiProperty({ description: 'Reason' })
    reason: string;

    @ApiProperty({ description: 'Source' })
    source: string;
}

export class AdminRecommendationDetailDto extends AdminRecommendationListItemDto {
    @ApiProperty({ description: 'Полный текст рекомендации' })
    fullText: string;

    @ApiPropertyOptional({ description: 'Input data summary' })
    inputDataSummary?: Record<string, unknown>;

    @ApiPropertyOptional({ description: 'Rule-based result' })
    ruleBasedResult?: Record<string, unknown>;

    @ApiPropertyOptional({ description: 'LLM result' })
    llmResult?: Record<string, unknown>;

    @ApiPropertyOptional({ description: 'User action' })
    userAction?: string;

    @ApiPropertyOptional({ description: 'Resolved at' })
    resolvedAt?: string;
}
