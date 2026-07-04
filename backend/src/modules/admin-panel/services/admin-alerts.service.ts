import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { AlertEventEntity, AlertEventDoc } from 'src/modules/ozon/alerts/entities/alert-event.entity';
import { UsersEntity, UsersDoc } from 'src/modules/users/entities/users.entity';
import { AdminAlertChannel, MarketplaceType } from '../enums/admin-panel.enum';
import {
    AdminAlertDetailDto,
    AdminAlertListItemDto,
    FilterAdminAlertsDto,
} from '../dto/admin-alert.dto';
import { sanitizeRecord } from '../utils/sanitize.util';

/** Admin API для alerts */
@Injectable()
export class AdminAlertsService {
    constructor(
        @DatabaseModel(AlertEventEntity.name)
        private readonly alertModel: Model<AlertEventDoc>,
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersDoc>,
        private readonly configService: ConfigService,
    ) {}

    async findAll(filter: FilterAdminAlertsDto): Promise<{
        data: AdminAlertListItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;
        const query = this.buildQuery(filter);

        const [rows, total] = await Promise.all([
            this.alertModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.alertModel.countDocuments(query).exec(),
        ]);

        const data = await Promise.all(rows.map((row) => this.toListItem(row)));

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
    }

    async findOne(id: string): Promise<AdminAlertDetailDto> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Alert не найден');
        }
        const row = await this.alertModel.findById(id).lean().exec();
        if (!row) {
            throw new NotFoundException('Alert не найден');
        }
        const listItem = await this.toListItem(row);
        return {
            ...listItem,
            payload: sanitizeRecord(row.payload as Record<string, unknown>),
        };
    }

    private buildQuery(filter: FilterAdminAlertsDto): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        if (filter.userId) {
            query.userId = new Types.ObjectId(filter.userId);
        }
        if (filter.status) {
            query.status = filter.status.toLowerCase();
        }
        if (filter.severity) {
            query.severity = filter.severity;
        }
        if (filter.dateFrom || filter.dateTo) {
            const dateFilter: { $gte?: Date; $lte?: Date } = {};
            if (filter.dateFrom) {
                dateFilter.$gte = new Date(filter.dateFrom);
            }
            if (filter.dateTo) {
                dateFilter.$lte = new Date(filter.dateTo);
            }
            query.createdAt = dateFilter;
        }

        return query;
    }

    private async toListItem(row: Record<string, unknown>): Promise<AdminAlertListItemDto> {
        const userId = row.userId as Types.ObjectId;
        const user = await this.usersModel.findById(userId).select('email').lean().exec();
        const payload = row.payload as Record<string, unknown> | undefined;
        const channel = this.resolveChannel(payload);

        return {
            id: String(row._id),
            createdAt: (row.createdAt as Date)?.toISOString?.() ?? '',
            marketplace: MarketplaceType.OZON,
            userId: String(userId),
            userEmail: String(user?.email ?? ''),
            connectionId: payload?.connectionId ? String(payload.connectionId) : undefined,
            channel,
            status: String(row.status ?? '').toUpperCase(),
            severity: String(row.severity ?? ''),
            message: String(row.message ?? ''),
            errorMessage: payload?.error ? String(payload.error) : undefined,
            relatedProductId: row.productId ? String(row.productId) : undefined,
            relatedRecommendationId: payload?.recommendationId
                ? String(payload.recommendationId)
                : undefined,
        };
    }

    private resolveChannel(payload?: Record<string, unknown>): AdminAlertChannel {
        if (payload?.channel === 'email') {
            return AdminAlertChannel.EMAIL;
        }
        const emailEnabled =
            this.configService.get<boolean>('ozon.alerts.emailEnabled') === true;
        const telegramEnabled =
            this.configService.get<boolean>('ozon.alerts.telegramEnabled') === true;
        if (telegramEnabled) {
            return AdminAlertChannel.TELEGRAM;
        }
        if (emailEnabled) {
            return AdminAlertChannel.EMAIL;
        }
        return AdminAlertChannel.TELEGRAM;
    }
}
