import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditCategory } from '../enums/audit-category.enum';
import { AuditStatus } from '../enums/audit-status.enum';

/** DTO для создания записи аудита (используется внутри сервиса) */
export class CreateAuditLogDto {
    @ApiProperty({ description: 'ID администратора' })
    @IsString()
    adminId: string;

    @ApiProperty({ description: 'Тип действия', enum: AuditAction })
    @IsEnum(AuditAction)
    action: AuditAction;

    @ApiProperty({ description: 'Сущность' })
    @IsString()
    entity: string;

    @ApiProperty({ description: 'Категория', enum: AuditCategory, required: false })
    @IsEnum(AuditCategory)
    @IsOptional()
    category?: AuditCategory;

    @ApiProperty({ description: 'Название объекта', required: false })
    @IsString()
    @IsOptional()
    objectName?: string;

    @ApiProperty({ description: 'ID сущности', required: false })
    @IsString()
    @IsOptional()
    entityId?: string;

    @ApiProperty({ description: 'Описание действия', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Краткое описание для таблицы', required: false })
    @IsString()
    @IsOptional()
    summary?: string;

    @ApiProperty({ description: 'Статус выполнения', enum: AuditStatus, required: false })
    @IsEnum(AuditStatus)
    @IsOptional()
    status?: AuditStatus;

    @ApiProperty({ description: 'Причина / комментарий', required: false })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiProperty({ description: 'Результат выполнения', required: false })
    @IsString()
    @IsOptional()
    executionResult?: string;

    @ApiProperty({ description: 'Данные до изменения', required: false })
    @IsObject()
    @IsOptional()
    oldData?: Record<string, unknown>;

    @ApiProperty({ description: 'Данные после изменения', required: false })
    @IsObject()
    @IsOptional()
    newData?: Record<string, unknown>;

    @ApiProperty({ description: 'IP адрес', required: false })
    @IsString()
    @IsOptional()
    ipAddress?: string;

    @ApiProperty({ description: 'User Agent', required: false })
    @IsString()
    @IsOptional()
    userAgent?: string;
}
