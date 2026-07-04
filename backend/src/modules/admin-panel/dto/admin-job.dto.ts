import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AdminJobStatus, MarketplaceType } from '../enums/admin-panel.enum';

export class FilterAdminJobsDto {
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

    @ApiPropertyOptional({ description: 'Очередь' })
    @IsOptional()
    @IsString()
    queue?: string;

    @ApiPropertyOptional({ description: 'Статус', enum: AdminJobStatus })
    @IsOptional()
    @IsEnum(AdminJobStatus)
    status?: AdminJobStatus;

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

    @ApiPropertyOptional({ description: 'Тип job' })
    @IsOptional()
    @IsString()
    jobType?: string;

    @ApiPropertyOptional({ description: 'Дата от (ISO)' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Дата до (ISO)' })
    @IsOptional()
    @IsString()
    dateTo?: string;
}

export class AdminJobListItemDto {
    @ApiProperty({ description: 'ID job' })
    id: string;

    @ApiProperty({ description: 'Очередь' })
    queue: string;

    @ApiProperty({ description: 'Маркетплейс' })
    marketplace: MarketplaceType;

    @ApiProperty({ description: 'ID пользователя' })
    userId: string;

    @ApiProperty({ description: 'Email пользователя' })
    userEmail: string;

    @ApiPropertyOptional({ description: 'ID подключения' })
    connectionId?: string;

    @ApiPropertyOptional({ description: 'Название подключения' })
    connectionName?: string;

    @ApiProperty({ description: 'Тип job' })
    jobType: string;

    @ApiProperty({ description: 'Статус', enum: AdminJobStatus })
    status: AdminJobStatus;

    @ApiProperty({ description: 'Попыток выполнено' })
    attemptsMade: number;

    @ApiProperty({ description: 'Макс. попыток' })
    maxAttempts: number;

    @ApiPropertyOptional({ description: 'Начало' })
    startedAt?: string;

    @ApiPropertyOptional({ description: 'Окончание' })
    finishedAt?: string;

    @ApiPropertyOptional({ description: 'Длительность, мс' })
    durationMs?: number;

    @ApiPropertyOptional({ description: 'Сообщение об ошибке' })
    errorMessage?: string;
}

export class AdminJobDetailDto extends AdminJobListItemDto {
    @ApiPropertyOptional({ description: 'Sanitized job data' })
    sanitizedData?: Record<string, unknown>;

    @ApiPropertyOptional({ description: 'Stacktrace' })
    stacktrace?: string[];
}
