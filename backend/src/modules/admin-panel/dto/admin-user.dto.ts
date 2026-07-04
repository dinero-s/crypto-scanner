import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AppUserRole } from 'src/common/constants/app-role.constant';
import { AdminUserStatus } from '../enums/admin-panel.enum';

export class FilterAdminUsersDto {
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

    @ApiPropertyOptional({ description: 'Поиск по email/имени' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Статус', enum: AdminUserStatus })
    @IsOptional()
    @IsEnum(AdminUserStatus)
    status?: AdminUserStatus;

    @ApiPropertyOptional({ description: 'Роль', enum: AppUserRole })
    @IsOptional()
    @IsEnum(AppUserRole)
    role?: AppUserRole;

    @ApiPropertyOptional({ description: 'Дата регистрации от (ISO)' })
    @IsOptional()
    @IsString()
    createdFrom?: string;

    @ApiPropertyOptional({ description: 'Дата регистрации до (ISO)' })
    @IsOptional()
    @IsString()
    createdTo?: string;
}

export class AdminUserListItemDto {
    @ApiProperty({ description: 'ID пользователя' })
    id: string;

    @ApiProperty({ description: 'Email' })
    email: string;

    @ApiProperty({ description: 'Имя' })
    name: string;

    @ApiProperty({ description: 'Роль' })
    role: string;

    @ApiProperty({ description: 'Статус', enum: AdminUserStatus })
    status: AdminUserStatus;

    @ApiPropertyOptional({ description: 'Дата регистрации' })
    createdAt?: string;

    @ApiPropertyOptional({ description: 'Последний вход' })
    lastLoginAt?: string;

    @ApiProperty({ description: 'Кол-во Ozon-подключений' })
    ozonConnectionsCount: number;

    @ApiProperty({ description: 'Активных Ozon-подключений' })
    activeOzonConnectionsCount: number;

    @ApiProperty({ description: 'Кол-во рекомендаций' })
    recommendationsCount: number;

    @ApiProperty({ description: 'Кол-во алертов' })
    alertsCount: number;
}

export class AdminUserDetailDto extends AdminUserListItemDto {
    @ApiProperty({ description: 'Подключения маркетплейсов' })
    marketplaceConnections: Array<{
        id: string;
        name: string;
        status: string;
        lastSyncAt?: string;
    }>;

    @ApiProperty({ description: 'Последние audit actions' })
    recentAuditActions: Array<{
        id: string;
        action: string;
        summary?: string;
        createdAt?: string;
    }>;

    @ApiProperty({ description: 'Последние sync errors' })
    recentSyncErrors: Array<{
        id: string;
        action: string;
        summary?: string;
        createdAt?: string;
    }>;

    @ApiProperty({ description: 'Последние alerts' })
    recentAlerts: Array<{
        id: string;
        message: string;
        status: string;
        severity: string;
        createdAt?: string;
    }>;

    @ApiProperty({ description: 'Последние recommendations' })
    recentRecommendations: Array<{
        id: string;
        title: string;
        severity: string;
        status: string;
        createdAt?: string;
    }>;
}

export class ChangeAdminUserRoleDto {
    @ApiProperty({ description: 'Новая роль', enum: AppUserRole })
    @IsEnum(AppUserRole)
    role: AppUserRole;
}
