import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import { DatabaseConnection } from 'src/common/database/decorators/database.decorator';
import {
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { OzonConnectionStatus } from 'src/modules/ozon/constants/ozon.enums';
import {
    OzonConnectionDoc,
    OzonConnectionEntity,
} from 'src/modules/ozon/integration/entities/ozon-connection.entity';
import { UsersEntity, UsersDoc } from 'src/modules/users/entities/users.entity';
import { AlertEventEntity, AlertEventDoc } from 'src/modules/ozon/alerts/entities/alert-event.entity';
import {
    RecommendationEntity,
    RecommendationDoc,
} from 'src/modules/ozon/analytics/entities/recommendation.entity';
import { ComplianceLogEntity, ComplianceLogDoc } from '../entities/compliance-log.entity';
import {
    OzonConnectionAuditEntity,
    OzonConnectionAuditDoc,
} from 'src/modules/ozon/integration/entities/ozon-connection-audit.entity';
import { OzonSeverity } from 'src/modules/ozon/constants/ozon.enums';
import { docCreatedAt } from '../utils/doc-date.util';
import { AdminOverviewResponseDto } from '../dto/admin-overview-response.dto';
import { HealthServiceStatus } from '../enums/admin-panel.enum';

/** Сводка для admin overview */
@Injectable()
export class AdminOverviewService {
    constructor(
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersDoc>,
        @DatabaseModel(OzonConnectionEntity.name)
        private readonly connectionModel: Model<OzonConnectionDoc>,
        @DatabaseModel(ComplianceLogEntity.name)
        private readonly complianceModel: Model<ComplianceLogDoc>,
        @DatabaseModel(AlertEventEntity.name)
        private readonly alertModel: Model<AlertEventDoc>,
        @DatabaseModel(RecommendationEntity.name)
        private readonly recommendationModel: Model<RecommendationDoc>,
        @DatabaseModel(OzonConnectionAuditEntity.name)
        private readonly connectionAuditModel: Model<OzonConnectionAuditDoc>,
        @InjectQueue(QUEUE_NAMES.OZON_SYNC)
        private readonly ozonQueue: Queue,
        @DatabaseConnection()
        private readonly mongo: Connection,
        private readonly configService: ConfigService,
    ) {}

    async getOverview(): Promise<AdminOverviewResponseDto> {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            activeUsers,
            blockedUsers,
            totalOzonConnections,
            activeOzonConnections,
            failedOzonConnections,
            deletedOzonConnections,
            syncJobs24h,
            failedSyncJobs24h,
            complianceBlocks24h,
            alertsSent24h,
            alertsFailed24h,
            recommendationsTotal,
            criticalRecommendations,
            lastSyncConnection,
            recentErrors,
            recentComplianceBlocks,
            recentFailedJobs,
            systemHealth,
        ] = await Promise.all([
            this.usersModel.countDocuments({ isDeleted: false }).exec(),
            this.usersModel
                .countDocuments({ isDeleted: false, isBlocked: false, isDisabled: false })
                .exec(),
            this.usersModel.countDocuments({ isBlocked: true, isDeleted: false }).exec(),
            this.connectionModel.countDocuments({}).exec(),
            this.connectionModel
                .countDocuments({
                    status: OzonConnectionStatus.ACTIVE,
                    deletedAt: { $exists: false },
                })
                .exec(),
            this.connectionModel
                .countDocuments({
                    status: { $in: [OzonConnectionStatus.ERROR, OzonConnectionStatus.INVALID] },
                    deletedAt: { $exists: false },
                })
                .exec(),
            this.connectionModel.countDocuments({ deletedAt: { $exists: true } }).exec(),
            this.countJobsSince(since24h),
            this.countFailedJobsSince(since24h),
            this.complianceModel
                .countDocuments({ blocked: true, createdAt: { $gte: since24h } })
                .exec(),
            this.alertModel
                .countDocuments({ status: 'sent', createdAt: { $gte: since24h } })
                .exec(),
            this.alertModel
                .countDocuments({ status: 'failed', createdAt: { $gte: since24h } })
                .exec(),
            this.recommendationModel.countDocuments({}).exec(),
            this.recommendationModel
                .countDocuments({ severity: OzonSeverity.CRITICAL })
                .exec(),
            this.connectionModel
                .findOne({ deletedAt: { $exists: false }, lastSyncAt: { $exists: true } })
                .sort({ lastSyncAt: -1 })
                .select({ lastSyncAt: 1 })
                .lean()
                .exec(),
            this.connectionAuditModel
                .find({ status: 'failed' })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean()
                .exec(),
            this.complianceModel
                .find({ blocked: true })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean()
                .exec(),
            this.getRecentFailedJobs(5),
            this.buildSystemHealth(),
        ]);

        return {
            totalUsers,
            activeUsers,
            blockedUsers,
            totalOzonConnections,
            activeOzonConnections,
            failedOzonConnections,
            deletedOzonConnections,
            syncJobs24h,
            failedSyncJobs24h,
            complianceBlocks24h,
            alertsSent24h,
            alertsFailed24h,
            recommendationsTotal,
            criticalRecommendations,
            lastSyncAt: lastSyncConnection?.lastSyncAt?.toISOString(),
            recentErrors: recentErrors.map((item) => ({
                id: String(item._id),
                summary: item.summary ?? item.action,
                createdAt: docCreatedAt(item) ?? '',
            })),
            recentComplianceBlocks: recentComplianceBlocks.map((item) => ({
                id: String(item._id),
                endpoint: item.endpoint,
                reason: item.reason,
                createdAt: docCreatedAt(item) ?? '',
            })),
            recentFailedJobs,
            systemHealth,
        };
    }

    private async countJobsSince(since: Date): Promise<number> {
        const jobs = await this.ozonQueue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed'], 0, 500);
        return jobs.filter((job) => {
            const ts = job.timestamp ?? 0;
            return ts >= since.getTime();
        }).length;
    }

    private async countFailedJobsSince(since: Date): Promise<number> {
        const jobs = await this.ozonQueue.getJobs(['failed'], 0, 500);
        return jobs.filter((job) => {
            const ts = job.finishedOn ?? job.timestamp ?? 0;
            return ts >= since.getTime();
        }).length;
    }

    private async getRecentFailedJobs(limit: number): Promise<Array<{
        id: string;
        jobType: string;
        errorMessage?: string;
        finishedAt?: string;
    }>> {
        const jobs = await this.ozonQueue.getJobs(['failed'], 0, limit);
        return jobs.map((job) => ({
            id: job.id ?? '',
            jobType: job.name,
            errorMessage: job.failedReason,
            finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
        }));
    }

    private async buildSystemHealth(): Promise<AdminOverviewResponseDto['systemHealth']> {
        const checkedAt = new Date().toISOString();
        const mongoOk = this.mongo.readyState === 1;

        let redisStatus = HealthServiceStatus.UNKNOWN;
        try {
            const redis = new Redis({
                host: this.configService.get<string>('redis.host') ?? 'localhost',
                port: this.configService.get<number>('redis.port') ?? 6379,
                password: this.configService.get<string>('redis.password'),
                db: this.configService.get<number>('redis.db') ?? 0,
                maxRetriesPerRequest: 1,
                connectTimeout: 3000,
            });
            await redis.ping();
            redis.disconnect();
            redisStatus = HealthServiceStatus.OK;
        } catch {
            redisStatus = HealthServiceStatus.DOWN;
        }

        let bullmqStatus = HealthServiceStatus.UNKNOWN;
        try {
            await this.ozonQueue.getJobCounts();
            bullmqStatus = HealthServiceStatus.OK;
        } catch {
            bullmqStatus = HealthServiceStatus.DOWN;
        }

        const telegramEnabled =
            this.configService.get<boolean>('ozon.alerts.telegramEnabled') === true;
        const emailEnabled =
            this.configService.get<boolean>('ozon.alerts.emailEnabled') === true;
        const llmEnabled =
            this.configService.get<boolean>('ozon.ai.enabled') === true;
        const sentryDsn = this.configService.get<string>('SENTRY_DSN');

        return {
            mongo: mongoOk ? HealthServiceStatus.OK : HealthServiceStatus.DOWN,
            redis: redisStatus,
            bullmq: bullmqStatus,
            backend: HealthServiceStatus.OK,
            telegram: telegramEnabled ? HealthServiceStatus.OK : HealthServiceStatus.UNKNOWN,
            mailer: emailEnabled ? HealthServiceStatus.OK : HealthServiceStatus.UNKNOWN,
            llm: llmEnabled ? HealthServiceStatus.OK : HealthServiceStatus.UNKNOWN,
            sentry: sentryDsn ? HealthServiceStatus.OK : HealthServiceStatus.UNKNOWN,
            checkedAt,
        };
    }
}
