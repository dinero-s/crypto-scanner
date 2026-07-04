import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { OzonConnectionService } from 'src/modules/ozon/integration/services/ozon-connection.service';
import { OzonQueueProducerService } from 'src/modules/ozon/queue/ozon-queue.producer.service';
import {
    OzonConnectionDoc,
    OzonConnectionEntity,
} from 'src/modules/ozon/integration/entities/ozon-connection.entity';
import { UsersEntity, UsersDoc } from 'src/modules/users/entities/users.entity';
import { SellerProductEntity, SellerProductDoc } from 'src/modules/ozon/seller/entities/seller-product.entity';
import { CompetitorProductEntity, CompetitorProductDoc } from 'src/modules/ozon/competitor/entities/competitor-product.entity';
import { RecommendationEntity, RecommendationDoc } from 'src/modules/ozon/analytics/entities/recommendation.entity';
import { AlertEventEntity, AlertEventDoc } from 'src/modules/ozon/alerts/entities/alert-event.entity';
import {
    OzonConnectionAuditEntity,
    OzonConnectionAuditDoc,
} from 'src/modules/ozon/integration/entities/ozon-connection-audit.entity';
import { ComplianceLogEntity, ComplianceLogDoc } from '../entities/compliance-log.entity';
import { OzonConnectionStatus } from 'src/modules/ozon/constants/ozon.enums';
import { AuditAction } from 'src/modules/audit-log/enums/audit-action.enum';
import { maskClientId } from '../utils/mask-client-id.util';
import {
    ConnectionHealthStatus,
    MarketplaceType,
} from '../enums/admin-panel.enum';
import {
    AdminConnectionDetailDto,
    AdminConnectionListItemDto,
    FilterAdminConnectionsDto,
} from '../dto/admin-connection.dto';
import { docCreatedAt } from '../utils/doc-date.util';
import {
    AdminAuditContext,
    AdminAuditWriterService,
} from './admin-audit-writer.service';

/** Admin API для marketplace-подключений */
@Injectable()
export class AdminConnectionsService {
    constructor(
        @DatabaseModel(OzonConnectionEntity.name)
        private readonly connectionModel: Model<OzonConnectionDoc>,
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersDoc>,
        @DatabaseModel(SellerProductEntity.name)
        private readonly productModel: Model<SellerProductDoc>,
        @DatabaseModel(CompetitorProductEntity.name)
        private readonly competitorModel: Model<CompetitorProductDoc>,
        @DatabaseModel(RecommendationEntity.name)
        private readonly recommendationModel: Model<RecommendationDoc>,
        @DatabaseModel(AlertEventEntity.name)
        private readonly alertModel: Model<AlertEventDoc>,
        @DatabaseModel(OzonConnectionAuditEntity.name)
        private readonly connectionAuditModel: Model<OzonConnectionAuditDoc>,
        @DatabaseModel(ComplianceLogEntity.name)
        private readonly complianceModel: Model<ComplianceLogDoc>,
        private readonly ozonConnectionService: OzonConnectionService,
        private readonly ozonQueueProducer: OzonQueueProducerService,
        private readonly auditWriter: AdminAuditWriterService,
    ) {}

    async findAll(filter: FilterAdminConnectionsDto): Promise<{
        data: AdminConnectionListItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;
        const query = await this.buildQuery(filter);

        const [connections, total] = await Promise.all([
            this.connectionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.connectionModel.countDocuments(query).exec(),
        ]);

        const data = await Promise.all(connections.map((c) => this.toListItem(c)));

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    async findOne(id: string, ctx: AdminAuditContext): Promise<AdminConnectionDetailDto> {
        const connection = await this.ozonConnectionService.findByIdAdmin(id);
        const user = await this.usersModel.findById(connection.userId).select('email fullName').lean().exec();

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        await this.auditWriter.log(
            ctx,
            AuditAction.ADMIN_VIEWED_CONNECTION,
            'ozon_connections',
            id,
            `Admin просмотрел подключение ${connection.sellerName}`,
        );

        const connectionId = new Types.ObjectId(id);
        const userId = connection.userId;

        const [
            productsCount,
            competitorsCount,
            recommendationsCount,
            alertsCount,
            errorsCount,
            lastHealth,
            lastSync,
            auditSummary,
            complianceSummary,
        ] = await Promise.all([
            this.productModel.countDocuments({ connectionId }).exec(),
            this.competitorModel.countDocuments({ userId }).exec(),
            this.recommendationModel.countDocuments({ userId }).exec(),
            this.alertModel.countDocuments({ userId }).exec(),
            this.connectionAuditModel.countDocuments({ connectionId, status: 'failed' }).exec(),
            this.connectionAuditModel
                .findOne({ connectionId, action: 'health_check' })
                .sort({ createdAt: -1 })
                .lean()
                .exec(),
            this.connectionAuditModel
                .findOne({ connectionId, action: { $in: ['sync_completed', 'sync_failed'] } })
                .sort({ createdAt: -1 })
                .lean()
                .exec(),
            this.connectionAuditModel.find({ connectionId }).sort({ createdAt: -1 }).limit(5).lean().exec(),
            this.complianceModel.find({ connectionId }).sort({ createdAt: -1 }).limit(5).lean().exec(),
        ]);

        return {
            id,
            marketplace: MarketplaceType.OZON,
            connectionName: connection.sellerName,
            maskedClientId: maskClientId(connection.clientId),
            status: connection.status,
            healthStatus: this.resolveHealthStatus(connection),
            lastSyncAt: connection.lastSyncAt?.toISOString(),
            productsCount,
            competitorsCount,
            recommendationsCount,
            alertsCount,
            errorsCount,
            createdAt: (connection as OzonConnectionDoc & { createdAt?: Date }).createdAt?.toISOString?.(),
            user: {
                id: String(userId),
                email: String(user.email ?? ''),
                name: String(user.fullName ?? ''),
            },
            healthSummary: {
                lastCheckAt: docCreatedAt(lastHealth),
                status: lastHealth?.status,
            },
            lastSyncSummary: {
                action: lastSync?.action,
                status: lastSync?.status,
                at: docCreatedAt(lastSync),
            },
            productsSyncStatus: { count: productsCount },
            reportsSyncStatus: { available: true },
            competitorsSyncStatus: { count: competitorsCount },
            alertsSummary: { count: alertsCount },
            recommendationsSummary: { count: recommendationsCount },
            auditSummary: auditSummary.map((a) => ({
                id: String(a._id),
                action: a.action,
                status: a.status,
                createdAt: docCreatedAt(a),
            })),
            complianceSummary: complianceSummary.map((c) => ({
                id: String(c._id),
                decision: c.decision,
                endpoint: c.endpoint,
                blocked: c.blocked,
                createdAt: docCreatedAt(c),
            })),
        };
    }

    async runHealth(id: string, ctx: AdminAuditContext): Promise<{ healthy: boolean; status: string }> {
        const result = await this.ozonConnectionService.healthCheckAdmin(id);
        await this.auditWriter.log(
            ctx,
            AuditAction.ADMIN_RAN_HEALTH_CHECK,
            'ozon_connections',
            id,
            `Admin запустил health check`,
        );
        return { healthy: result.healthy, status: result.status };
    }

    async runSync(id: string, ctx: AdminAuditContext): Promise<{ message: string }> {
        const connection = await this.ozonConnectionService.findByIdAdmin(id);
        if (connection.deletedAt) {
            throw new BadRequestException('Нельзя синхронизировать удалённое подключение');
        }
        await this.ozonQueueProducer.enqueueFullSync(id, String(connection.userId));
        await this.auditWriter.log(
            ctx,
            AuditAction.ADMIN_STARTED_CONNECTION_SYNC,
            'ozon_connections',
            id,
            `Admin запустил sync`,
        );
        return { message: 'Sync job поставлен в очередь' };
    }

    async pause(id: string, ctx: AdminAuditContext): Promise<{ message: string }> {
        await this.ozonConnectionService.pauseConnection(id);
        await this.auditWriter.log(
            ctx,
            AuditAction.ADMIN_PAUSED_CONNECTION,
            'ozon_connections',
            id,
            'Admin приостановил подключение',
        );
        return { message: 'Подключение приостановлено' };
    }

    async resume(id: string, ctx: AdminAuditContext): Promise<{ message: string }> {
        await this.ozonConnectionService.resumeConnection(id);
        await this.auditWriter.log(
            ctx,
            AuditAction.ADMIN_RESUMED_CONNECTION,
            'ozon_connections',
            id,
            'Admin возобновил подключение',
        );
        return { message: 'Подключение возобновлено' };
    }

    async softDelete(id: string, ctx: AdminAuditContext): Promise<{ message: string }> {
        await this.ozonConnectionService.softDeleteAdmin(id);
        await this.auditWriter.log(
            ctx,
            AuditAction.ADMIN_SOFT_DELETED_CONNECTION,
            'ozon_connections',
            id,
            'Admin выполнил soft delete подключения',
        );
        return { message: 'Подключение удалено (soft delete)' };
    }

    private async buildQuery(filter: FilterAdminConnectionsDto): Promise<Record<string, unknown>> {
        const query: Record<string, unknown> = {};

        if (filter.marketplace && filter.marketplace !== MarketplaceType.OZON) {
            return { _id: null };
        }

        if (filter.status) {
            query.status = filter.status;
        } else {
            query.deletedAt = { $exists: false };
        }

        if (filter.userId) {
            query.userId = new Types.ObjectId(filter.userId);
        }

        if (filter.lastSyncFrom || filter.lastSyncTo) {
            const dateFilter: { $gte?: Date; $lte?: Date } = {};
            if (filter.lastSyncFrom) {
                dateFilter.$gte = new Date(filter.lastSyncFrom);
            }
            if (filter.lastSyncTo) {
                dateFilter.$lte = new Date(filter.lastSyncTo);
            }
            query.lastSyncAt = dateFilter;
        }

        if (filter.search) {
            query.sellerName = { $regex: filter.search, $options: 'i' };
        }

        if (filter.healthStatus) {
            if (filter.healthStatus === ConnectionHealthStatus.PAUSED) {
                query.status = OzonConnectionStatus.PAUSED;
            } else if (filter.healthStatus === ConnectionHealthStatus.FAILED) {
                query.status = { $in: [OzonConnectionStatus.ERROR, OzonConnectionStatus.INVALID] };
            } else if (filter.healthStatus === ConnectionHealthStatus.OK) {
                query.status = OzonConnectionStatus.ACTIVE;
            }
        }

        return query;
    }

    private async toListItem(
        connection: Record<string, unknown>,
    ): Promise<AdminConnectionListItemDto> {
        const id = String(connection._id);
        const userId = connection.userId as Types.ObjectId;
        const user = await this.usersModel.findById(userId).select('email').lean().exec();
        const connectionId = new Types.ObjectId(id);

        const [productsCount, competitorsCount, recommendationsCount, alertsCount, errorsCount] =
            await Promise.all([
                this.productModel.countDocuments({ connectionId }).exec(),
                this.competitorModel.countDocuments({ userId }).exec(),
                this.recommendationModel.countDocuments({ userId }).exec(),
                this.alertModel.countDocuments({ userId }).exec(),
                this.connectionAuditModel
                    .countDocuments({ connectionId, status: 'failed' })
                    .exec(),
            ]);

        return {
            id,
            marketplace: MarketplaceType.OZON,
            userId: String(userId),
            userEmail: String(user?.email ?? ''),
            connectionName: String(connection.sellerName ?? ''),
            status: String(connection.status ?? ''),
            healthStatus: this.resolveHealthStatus(connection as unknown as OzonConnectionDoc),
            lastSyncAt: connection.lastSyncAt
                ? new Date(connection.lastSyncAt as Date).toISOString()
                : undefined,
            productsCount,
            competitorsCount,
            recommendationsCount,
            alertsCount,
            errorsCount,
            createdAt: connection.createdAt
                ? new Date(connection.createdAt as Date).toISOString()
                : undefined,
        };
    }

    private resolveHealthStatus(connection: OzonConnectionDoc | Record<string, unknown>): ConnectionHealthStatus {
        const status = String(connection.status ?? '');
        if (status === OzonConnectionStatus.PAUSED) {
            return ConnectionHealthStatus.PAUSED;
        }
        if (status === OzonConnectionStatus.ERROR || status === OzonConnectionStatus.INVALID) {
            return ConnectionHealthStatus.FAILED;
        }
        if (status === OzonConnectionStatus.ACTIVE) {
            return ConnectionHealthStatus.OK;
        }
        return ConnectionHealthStatus.UNKNOWN;
    }
}
