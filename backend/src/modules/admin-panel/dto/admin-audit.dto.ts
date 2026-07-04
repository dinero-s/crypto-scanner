import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AuditAction } from 'src/modules/audit-log/enums/audit-action.enum';
import { AuditStatus } from 'src/modules/audit-log/enums/audit-status.enum';
import { AdminRole } from 'src/modules/admin-users/enums/roles.enum';

export class FilterAdminAuditLogsDto {
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

    @ApiPropertyOptional({ description: 'ID актора' })
    @IsOptional()
    @IsString()
    actorId?: string;

    @ApiPropertyOptional({ description: 'Роль актора', enum: AdminRole })
    @IsOptional()
    @IsEnum(AdminRole)
    actorRole?: AdminRole;

    @ApiPropertyOptional({ description: 'Action', enum: AuditAction })
    @IsOptional()
    @IsEnum(AuditAction)
    action?: AuditAction;

    @ApiPropertyOptional({ description: 'Тип сущности' })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({ description: 'ID сущности' })
    @IsOptional()
    @IsString()
    entityId?: string;

    @ApiPropertyOptional({ description: 'Статус', enum: AuditStatus })
    @IsOptional()
    @IsEnum(AuditStatus)
    status?: AuditStatus;

    @ApiPropertyOptional({ description: 'Дата от (ISO)' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Дата до (ISO)' })
    @IsOptional()
    @IsString()
    dateTo?: string;
}

export class AdminAuditLogListItemDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: 'Дата' })
    createdAt: string;

    @ApiProperty({ description: 'ID актора' })
    actorId: string;

    @ApiProperty({ description: 'Email актора' })
    actorEmail: string;

    @ApiProperty({ description: 'Роль актора' })
    actorRole: string;

    @ApiProperty({ description: 'Action' })
    action: string;

    @ApiProperty({ description: 'Тип сущности' })
    entityType: string;

    @ApiPropertyOptional({ description: 'ID сущности' })
    entityId?: string;

    @ApiPropertyOptional({ description: 'IP' })
    ip?: string;

    @ApiPropertyOptional({ description: 'User agent' })
    userAgent?: string;

    @ApiPropertyOptional({ description: 'Статус' })
    status?: string;

    @ApiProperty({ description: 'Сообщение' })
    message: string;
}

export class AdminAuditLogDetailDto extends AdminAuditLogListItemDto {}
