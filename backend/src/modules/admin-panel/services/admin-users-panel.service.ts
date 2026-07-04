import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { UsersEntity, UsersDoc } from 'src/modules/users/entities/users.entity';
import { OzonConnectionEntity, OzonConnectionDoc } from 'src/modules/ozon/integration/entities/ozon-connection.entity';
import { OzonConnectionStatus } from 'src/modules/ozon/constants/ozon.enums';
import { AlertEventEntity, AlertEventDoc } from 'src/modules/ozon/alerts/entities/alert-event.entity';
import { RecommendationEntity, RecommendationDoc } from 'src/modules/ozon/analytics/entities/recommendation.entity';
import {
    OzonConnectionAuditEntity,
    OzonConnectionAuditDoc,
} from 'src/modules/ozon/integration/entities/ozon-connection-audit.entity';
import { AuditLogEntity, AuditLogDoc } from 'src/modules/audit-log/entities/audit-log.entity';
import { AppUserRole } from 'src/common/constants/app-role.constant';
import { UsersService } from 'src/modules/users/services/users.service';
import { AdminUserStatus } from '../enums/admin-panel.enum';
import {
    AdminUserDetailDto,
    AdminUserListItemDto,
    FilterAdminUsersDto,
} from '../dto/admin-user.dto';
import { docCreatedAt } from '../utils/doc-date.util';

/** Admin API для пользователей платформы (продавцы) */
@Injectable()
export class AdminUsersPanelService {
    constructor(
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersDoc>,
        @DatabaseModel(OzonConnectionEntity.name)
        private readonly connectionModel: Model<OzonConnectionDoc>,
        @DatabaseModel(AlertEventEntity.name)
        private readonly alertModel: Model<AlertEventDoc>,
        @DatabaseModel(RecommendationEntity.name)
        private readonly recommendationModel: Model<RecommendationDoc>,
        @DatabaseModel(OzonConnectionAuditEntity.name)
        private readonly connectionAuditModel: Model<OzonConnectionAuditDoc>,
        @DatabaseModel(AuditLogEntity.name)
        private readonly auditLogModel: Model<AuditLogDoc>,
        private readonly usersService: UsersService,
    ) {}

    async findAll(filter: FilterAdminUsersDto): Promise<{
        data: AdminUserListItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;
        const query = this.buildUserQuery(filter);

        const [users, total] = await Promise.all([
            this.usersModel
                .find(query)
                .select('-password -phoneConfirmationCode -passwordResetCode -emailConfirmationCode')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.usersModel.countDocuments(query).exec(),
        ]);

        const data = await Promise.all(
            users.map(async (user) => this.toListItem(user)),
        );

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    async findOne(id: string): Promise<AdminUserDetailDto> {
        const user = await this.usersService.findOne(id);
        const userId = new Types.ObjectId(id);

        const [
            connections,
            ozonConnectionsCount,
            activeOzonConnectionsCount,
            recommendationsCount,
            alertsCount,
            auditActions,
            syncErrors,
            alerts,
            recommendations,
        ] = await Promise.all([
            this.connectionModel
                .find({ userId, deletedAt: { $exists: false } })
                .select({ sellerName: 1, status: 1, lastSyncAt: 1 })
                .lean()
                .exec(),
            this.connectionModel.countDocuments({ userId }).exec(),
            this.connectionModel
                .countDocuments({
                    userId,
                    status: OzonConnectionStatus.ACTIVE,
                    deletedAt: { $exists: false },
                })
                .exec(),
            this.recommendationModel.countDocuments({ userId }).exec(),
            this.alertModel.countDocuments({ userId }).exec(),
            this.auditLogModel
                .find({ entity: 'users', entityId: id })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
                .exec(),
            this.connectionAuditModel
                .find({ userId, status: 'failed' })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
                .exec(),
            this.alertModel.find({ userId }).sort({ createdAt: -1 }).limit(10).lean().exec(),
            this.recommendationModel
                .find({ userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
                .exec(),
        ]);

        const profile = user as Record<string, unknown>;

        return {
            id,
            email: String(profile.email ?? ''),
            name: String(profile.fullName ?? ''),
            role: String(profile.role ?? AppUserRole.USER),
            status: this.resolveUserStatus(profile),
            createdAt: this.toIso(profile.registrationDate ?? profile.createdAt),
            lastLoginAt: this.toIso(profile.lastLoginAt),
            ozonConnectionsCount,
            activeOzonConnectionsCount,
            recommendationsCount,
            alertsCount,
            marketplaceConnections: connections.map((c) => ({
                id: String(c._id),
                name: c.sellerName,
                status: c.status,
                lastSyncAt: c.lastSyncAt?.toISOString(),
            })),
            recentAuditActions: auditActions.map((a) => ({
                id: String(a._id),
                action: a.action,
                summary: a.summary ?? a.description,
                createdAt: docCreatedAt(a),
            })),
            recentSyncErrors: syncErrors.map((e) => ({
                id: String(e._id),
                action: e.action,
                summary: e.summary,
                createdAt: docCreatedAt(e),
            })),
            recentAlerts: alerts.map((a) => ({
                id: String(a._id),
                message: a.message,
                status: a.status,
                severity: a.severity,
                createdAt: docCreatedAt(a),
            })),
            recentRecommendations: recommendations.map((r) => ({
                id: String(r._id),
                title: r.title,
                severity: r.severity,
                status: r.status,
                createdAt: docCreatedAt(r),
            })),
        };
    }

    private buildUserQuery(filter: FilterAdminUsersDto): Record<string, unknown> {
        const query: Record<string, unknown> = { isDeleted: false };

        if (filter.status === AdminUserStatus.BLOCKED) {
            query.isBlocked = true;
        } else if (filter.status === AdminUserStatus.DISABLED) {
            query.isDisabled = true;
        } else if (filter.status === AdminUserStatus.ACTIVE) {
            query.isBlocked = false;
            query.isDisabled = false;
        }

        if (filter.role) {
            query.role = filter.role;
        }

        if (filter.search) {
            query.$or = [
                { fullName: { $regex: filter.search, $options: 'i' } },
                { email: { $regex: filter.search, $options: 'i' } },
            ];
        }

        if (filter.createdFrom || filter.createdTo) {
            const dateFilter: { $gte?: Date; $lte?: Date } = {};
            if (filter.createdFrom) {
                dateFilter.$gte = new Date(filter.createdFrom);
            }
            if (filter.createdTo) {
                dateFilter.$lte = new Date(filter.createdTo);
            }
            query.registrationDate = dateFilter;
        }

        return query;
    }

    private async toListItem(user: Record<string, unknown>): Promise<AdminUserListItemDto> {
        const id = String(user._id);
        const userId = new Types.ObjectId(id);

        const [ozonConnectionsCount, activeOzonConnectionsCount, recommendationsCount, alertsCount] =
            await Promise.all([
                this.connectionModel.countDocuments({ userId }).exec(),
                this.connectionModel
                    .countDocuments({
                        userId,
                        status: OzonConnectionStatus.ACTIVE,
                        deletedAt: { $exists: false },
                    })
                    .exec(),
                this.recommendationModel.countDocuments({ userId }).exec(),
                this.alertModel.countDocuments({ userId }).exec(),
            ]);

        return {
            id,
            email: String(user.email ?? ''),
            name: String(user.fullName ?? ''),
            role: String(user.role ?? AppUserRole.USER),
            status: this.resolveUserStatus(user),
            createdAt: this.toIso(user.registrationDate ?? user.createdAt),
            lastLoginAt: this.toIso(user.lastLoginAt),
            ozonConnectionsCount,
            activeOzonConnectionsCount,
            recommendationsCount,
            alertsCount,
        };
    }

    private resolveUserStatus(user: Record<string, unknown>): AdminUserStatus {
        if (user.isDeleted) {
            return AdminUserStatus.DELETED;
        }
        if (user.isBlocked) {
            return AdminUserStatus.BLOCKED;
        }
        if (user.isDisabled) {
            return AdminUserStatus.DISABLED;
        }
        return AdminUserStatus.ACTIVE;
    }

    private toIso(value: unknown): string | undefined {
        if (!value) {
            return undefined;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        return String(value);
    }
}
