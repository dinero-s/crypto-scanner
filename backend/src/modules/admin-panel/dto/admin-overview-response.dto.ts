import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HealthServiceStatus } from '../enums/admin-panel.enum';

export class AdminSystemHealthDto {
    @ApiProperty({ description: 'Статус MongoDB', enum: HealthServiceStatus })
    mongo: HealthServiceStatus;

    @ApiProperty({ description: 'Статус Redis', enum: HealthServiceStatus })
    redis: HealthServiceStatus;

    @ApiProperty({ description: 'Статус BullMQ', enum: HealthServiceStatus })
    bullmq: HealthServiceStatus;

    @ApiProperty({ description: 'Статус backend', enum: HealthServiceStatus })
    backend: HealthServiceStatus;

    @ApiProperty({ description: 'Статус Telegram', enum: HealthServiceStatus })
    telegram: HealthServiceStatus;

    @ApiProperty({ description: 'Статус mailer', enum: HealthServiceStatus })
    mailer: HealthServiceStatus;

    @ApiProperty({ description: 'Статус LLM', enum: HealthServiceStatus })
    llm: HealthServiceStatus;

    @ApiPropertyOptional({ description: 'Статус Sentry', enum: HealthServiceStatus })
    sentry?: HealthServiceStatus;

    @ApiProperty({ description: 'Время проверки' })
    checkedAt: string;
}

export class AdminOverviewRecentErrorDto {
    @ApiProperty({ description: 'ID записи' })
    id: string;

    @ApiProperty({ description: 'Описание ошибки' })
    summary: string;

    @ApiProperty({ description: 'Дата' })
    createdAt: string;
}

export class AdminOverviewResponseDto {
    @ApiProperty({ description: 'Всего пользователей' })
    totalUsers: number;

    @ApiProperty({ description: 'Активных пользователей' })
    activeUsers: number;

    @ApiProperty({ description: 'Заблокированных пользователей' })
    blockedUsers: number;

    @ApiProperty({ description: 'Всего Ozon-подключений' })
    totalOzonConnections: number;

    @ApiProperty({ description: 'Активных Ozon-подключений' })
    activeOzonConnections: number;

    @ApiProperty({ description: 'Проблемных Ozon-подключений' })
    failedOzonConnections: number;

    @ApiProperty({ description: 'Удалённых Ozon-подключений' })
    deletedOzonConnections: number;

    @ApiProperty({ description: 'Sync jobs за 24ч' })
    syncJobs24h: number;

    @ApiProperty({ description: 'Failed sync jobs за 24ч' })
    failedSyncJobs24h: number;

    @ApiProperty({ description: 'Compliance blocks за 24ч' })
    complianceBlocks24h: number;

    @ApiProperty({ description: 'Отправленных alerts за 24ч' })
    alertsSent24h: number;

    @ApiProperty({ description: 'Failed alerts за 24ч' })
    alertsFailed24h: number;

    @ApiProperty({ description: 'Всего рекомендаций' })
    recommendationsTotal: number;

    @ApiProperty({ description: 'Критических рекомендаций' })
    criticalRecommendations: number;

    @ApiPropertyOptional({ description: 'Последняя синхронизация' })
    lastSyncAt?: string;

    @ApiProperty({ description: 'Недавние ошибки', type: [AdminOverviewRecentErrorDto] })
    recentErrors: AdminOverviewRecentErrorDto[];

    @ApiProperty({ description: 'Недавние compliance blocks' })
    recentComplianceBlocks: Array<{
        id: string;
        endpoint?: string;
        reason?: string;
        createdAt: string;
    }>;

    @ApiProperty({ description: 'Недавние failed jobs' })
    recentFailedJobs: Array<{
        id: string;
        jobType: string;
        errorMessage?: string;
        finishedAt?: string;
    }>;

    @ApiProperty({ description: 'System health', type: AdminSystemHealthDto })
    systemHealth: AdminSystemHealthDto;
}
