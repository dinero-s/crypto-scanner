import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ComplianceDecision, MarketplaceType } from '../enums/admin-panel.enum';
import { ComplianceLogEvent } from 'src/modules/ozon/constants/ozon.enums';

export class FilterAdminComplianceLogsDto {
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

    @ApiPropertyOptional({ description: 'Решение', enum: ComplianceDecision })
    @IsOptional()
    @IsEnum(ComplianceDecision)
    decision?: ComplianceDecision;

    @ApiPropertyOptional({ description: 'Request host' })
    @IsOptional()
    @IsString()
    requestHost?: string;

    @ApiPropertyOptional({ description: 'ID пользователя' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: 'ID подключения' })
    @IsOptional()
    @IsString()
    connectionId?: string;

    @ApiPropertyOptional({ description: 'Action', enum: ComplianceLogEvent })
    @IsOptional()
    @IsEnum(ComplianceLogEvent)
    action?: ComplianceLogEvent;

    @ApiPropertyOptional({ description: 'Дата от (ISO)' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Дата до (ISO)' })
    @IsOptional()
    @IsString()
    dateTo?: string;

    @ApiPropertyOptional({ description: 'Только blocked' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    blockedOnly?: boolean;
}

export class AdminComplianceLogListItemDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: 'Дата' })
    createdAt: string;

    @ApiProperty({ description: 'Маркетплейс' })
    marketplace: string;

    @ApiPropertyOptional({ description: 'ID пользователя' })
    userId?: string;

    @ApiPropertyOptional({ description: 'Email пользователя' })
    userEmail?: string;

    @ApiPropertyOptional({ description: 'ID подключения' })
    connectionId?: string;

    @ApiProperty({ description: 'Action' })
    action: string;

    @ApiPropertyOptional({ description: 'Request host' })
    requestHost?: string;

    @ApiPropertyOptional({ description: 'Endpoint' })
    endpoint?: string;

    @ApiPropertyOptional({ description: 'HTTP method' })
    method?: string;

    @ApiProperty({ description: 'Decision' })
    decision: string;

    @ApiPropertyOptional({ description: 'Reason' })
    reason?: string;

    @ApiProperty({ description: 'Blocked' })
    blocked: boolean;

    @ApiPropertyOptional({ description: 'Error code' })
    errorCode?: string;
}

export class AdminComplianceLogDetailDto extends AdminComplianceLogListItemDto {}
