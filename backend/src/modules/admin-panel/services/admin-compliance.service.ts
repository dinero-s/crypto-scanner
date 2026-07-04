import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { ComplianceLogEntity, ComplianceLogDoc } from '../entities/compliance-log.entity';
import { UsersEntity, UsersDoc } from 'src/modules/users/entities/users.entity';
import {
    AdminComplianceLogDetailDto,
    AdminComplianceLogListItemDto,
    FilterAdminComplianceLogsDto,
} from '../dto/admin-compliance.dto';

/** Admin API для compliance logs */
@Injectable()
export class AdminComplianceService {
    constructor(
        @DatabaseModel(ComplianceLogEntity.name)
        private readonly complianceModel: Model<ComplianceLogDoc>,
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersDoc>,
    ) {}

    async findAll(filter: FilterAdminComplianceLogsDto): Promise<{
        data: AdminComplianceLogListItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        summary: {
            blockedLast24h: number;
            allowedLast24h: number;
        };
    }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;
        const query = this.buildQuery(filter);
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [rows, total, blockedLast24h, allowedLast24h] = await Promise.all([
            this.complianceModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.complianceModel.countDocuments(query).exec(),
            this.complianceModel.countDocuments({ blocked: true, createdAt: { $gte: since24h } }).exec(),
            this.complianceModel.countDocuments({ blocked: false, createdAt: { $gte: since24h } }).exec(),
        ]);

        const data = await Promise.all(rows.map((row) => this.toListItem(row)));

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            summary: { blockedLast24h, allowedLast24h },
        };
    }

    async findOne(id: string): Promise<AdminComplianceLogDetailDto> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Compliance log не найден');
        }
        const row = await this.complianceModel.findById(id).lean().exec();
        if (!row) {
            throw new NotFoundException('Compliance log не найден');
        }
        const listItem = await this.toListItem(row);
        return { ...listItem };
    }

    private buildQuery(filter: FilterAdminComplianceLogsDto): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        if (filter.marketplace) {
            query.marketplace = filter.marketplace;
        }
        if (filter.decision) {
            query.decision = filter.decision;
        }
        if (filter.requestHost) {
            query.requestHost = { $regex: filter.requestHost, $options: 'i' };
        }
        if (filter.userId) {
            query.userId = new Types.ObjectId(filter.userId);
        }
        if (filter.connectionId) {
            query.connectionId = new Types.ObjectId(filter.connectionId);
        }
        if (filter.action) {
            query.action = filter.action;
        }
        if (filter.blockedOnly) {
            query.blocked = true;
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

    private async toListItem(
        row: Record<string, unknown>,
    ): Promise<AdminComplianceLogListItemDto> {
        const userId = row.userId as Types.ObjectId | undefined;
        const user = userId
            ? await this.usersModel.findById(userId).select('email').lean().exec()
            : null;

        return {
            id: String(row._id),
            createdAt: (row.createdAt as Date)?.toISOString?.() ?? '',
            marketplace: String(row.marketplace ?? ''),
            userId: userId ? String(userId) : undefined,
            userEmail: String(user?.email ?? ''),
            connectionId: row.connectionId ? String(row.connectionId) : undefined,
            action: String(row.action ?? ''),
            requestHost: row.requestHost ? String(row.requestHost) : undefined,
            endpoint: row.endpoint ? String(row.endpoint) : undefined,
            method: row.method ? String(row.method) : undefined,
            decision: String(row.decision ?? ''),
            reason: row.reason ? String(row.reason) : undefined,
            blocked: Boolean(row.blocked),
            errorCode: row.errorCode ? String(row.errorCode) : undefined,
        };
    }
}
