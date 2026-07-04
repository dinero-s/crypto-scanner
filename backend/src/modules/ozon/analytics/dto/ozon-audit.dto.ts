import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsIn,
    IsInt,
    IsMongoId,
    IsOptional,
    Max,
    Min,
} from 'class-validator';
import {
    OzonAuditRecommendationStatus,
    OzonDetectedIssueStatus,
    OzonDetectedIssueType,
    OzonAuditSeverity,
} from '../../constants/ozon.enums';

/** DTO запуска аудита */
export class RunAuditDto {
    @ApiProperty({ description: 'ID подключения Ozon', required: false })
    @IsMongoId()
    @IsOptional()
    connectionId?: string;

    @ApiProperty({
        description: 'Период аудита в днях',
        enum: [30, 60, 90],
        required: false,
        default: 30,
    })
    @Type(() => Number)
    @IsIn([30, 60, 90])
    @IsOptional()
    periodDays?: 30 | 60 | 90;
}

/** DTO фильтра списка проблем */
export class ListIssuesQueryDto {
    @ApiProperty({ description: 'ID подключения Ozon', required: false })
    @IsMongoId()
    @IsOptional()
    connectionId?: string;

    @ApiProperty({ description: 'Статус проблемы', enum: OzonDetectedIssueStatus, required: false })
    @IsEnum(OzonDetectedIssueStatus)
    @IsOptional()
    status?: OzonDetectedIssueStatus;

    @ApiProperty({ description: 'Тип проблемы', enum: OzonDetectedIssueType, required: false })
    @IsEnum(OzonDetectedIssueType)
    @IsOptional()
    type?: OzonDetectedIssueType;

    @ApiProperty({ description: 'Серьёзность', enum: OzonAuditSeverity, required: false })
    @IsEnum(OzonAuditSeverity)
    @IsOptional()
    severity?: OzonAuditSeverity;

    @ApiProperty({ description: 'Лимит', required: false, default: 20 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number;

    @ApiProperty({ description: 'Страница', required: false, default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @ApiProperty({ description: 'Исключить FIXED/IGNORED', required: false })
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    excludeResolved?: boolean;
}

/** DTO обновления статуса проблемы */
export class UpdateIssueStatusDto {
    @ApiProperty({
        description: 'Новый статус',
        enum: [
            OzonDetectedIssueStatus.VIEWED,
            OzonDetectedIssueStatus.FIXED,
            OzonDetectedIssueStatus.IGNORED,
        ],
    })
    @IsIn([
        OzonDetectedIssueStatus.VIEWED,
        OzonDetectedIssueStatus.FIXED,
        OzonDetectedIssueStatus.IGNORED,
    ])
    status: OzonDetectedIssueStatus.VIEWED | OzonDetectedIssueStatus.FIXED | OzonDetectedIssueStatus.IGNORED;
}

/** DTO фильтра audit-рекомендаций */
export class ListAuditRecommendationsQueryDto {
    @ApiProperty({ description: 'ID подключения Ozon', required: false })
    @IsMongoId()
    @IsOptional()
    connectionId?: string;

    @ApiProperty({ description: 'Статус', enum: OzonAuditRecommendationStatus, required: false })
    @IsEnum(OzonAuditRecommendationStatus)
    @IsOptional()
    status?: OzonAuditRecommendationStatus;

    @ApiProperty({ description: 'Только активные (без DONE/IGNORED)', required: false })
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    activeOnly?: boolean;
}

/** DTO обновления статуса audit-рекомендации */
export class UpdateAuditRecommendationStatusDto {
    @ApiProperty({
        description: 'Новый статус',
        enum: [
            OzonAuditRecommendationStatus.VIEWED,
            OzonAuditRecommendationStatus.DONE,
            OzonAuditRecommendationStatus.IGNORED,
        ],
    })
    @IsIn([
        OzonAuditRecommendationStatus.VIEWED,
        OzonAuditRecommendationStatus.DONE,
        OzonAuditRecommendationStatus.IGNORED,
    ])
    status:
        | OzonAuditRecommendationStatus.VIEWED
        | OzonAuditRecommendationStatus.DONE
        | OzonAuditRecommendationStatus.IGNORED;
}

/** DTO фильтра последнего отчёта */
export class LatestAuditQueryDto {
    @ApiProperty({ description: 'ID подключения', required: false })
    @IsMongoId()
    @IsOptional()
    connectionId?: string;
}
