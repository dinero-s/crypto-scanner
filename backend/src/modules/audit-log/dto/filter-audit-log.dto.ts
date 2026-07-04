import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditCategory } from '../enums/audit-category.enum';
import { AuditStatus } from '../enums/audit-status.enum';
import { PaginationFilterDateDto } from 'src/common/pagination/dtos/pagination.filter-date.dto';

/** DTO для фильтрации записей аудита */
export class FilterAuditLogDto extends PaginationFilterDateDto {
    @ApiProperty({ description: 'Фильтр по типу действия', enum: AuditAction, required: false })
    @IsEnum(AuditAction)
    @IsOptional()
    action?: AuditAction;

    @ApiProperty({ description: 'Фильтр по категории', enum: AuditCategory, required: false })
    @IsEnum(AuditCategory)
    @IsOptional()
    category?: AuditCategory;

    @ApiProperty({ description: 'Фильтр по сущности', required: false })
    @IsString()
    @IsOptional()
    entity?: string;

    @ApiProperty({ description: 'Фильтр по статусу', enum: AuditStatus, required: false })
    @IsEnum(AuditStatus)
    @IsOptional()
    status?: AuditStatus;

    @ApiProperty({ description: 'Фильтр по ID администратора', required: false })
    @IsString()
    @IsOptional()
    adminId?: string;
}
