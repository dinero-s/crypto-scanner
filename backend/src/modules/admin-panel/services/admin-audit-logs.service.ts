import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { AuditLogEntity, AuditLogDoc } from 'src/modules/audit-log/entities/audit-log.entity';
import { AdminUsersEntity } from 'src/modules/admin-users/entities/admin-users.entity';
import {
    AdminAuditLogDetailDto,
    AdminAuditLogListItemDto,
    FilterAdminAuditLogsDto,
} from '../dto/admin-audit.dto';

/** Admin API для audit logs (spec format) */
@Injectable()
export class AdminAuditLogsService {
    constructor(
        @DatabaseModel(AuditLogEntity.name)
        private readonly auditLogModel: Model<AuditLogDoc>,
        @DatabaseModel(AdminUsersEntity.name)
        private readonly adminUsersModel: Model<AdminUsersEntity>,
    ) {}

    async findAll(filter: FilterAdminAuditLogsDto): Promise<{
        data: AdminAuditLogListItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;
        const query = await this.buildQuery(filter);

        const [rows, total] = await Promise.all([
            this.auditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.auditLogModel.countDocuments(query).exec(),
        ]);

        const data = await Promise.all(rows.map((row) => this.toListItem(row)));

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    async findOne(id: string): Promise<AdminAuditLogDetailDto> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Audit log не найден');
        }
        const row = await this.auditLogModel.findById(id).lean().exec();
        if (!row) {
            throw new NotFoundException('Audit log не найден');
        }
        return this.toListItem(row);
    }

    private async buildQuery(filter: FilterAdminAuditLogsDto): Promise<Record<string, unknown>> {
        const query: Record<string, unknown> = {};

        if (filter.actorId) {
            query.adminId = new Types.ObjectId(filter.actorId);
        }
        if (filter.action) {
            query.action = filter.action;
        }
        if (filter.entityType) {
            query.entity = filter.entityType;
        }
        if (filter.entityId) {
            query.entityId = filter.entityId;
        }
        if (filter.status) {
            query.status = filter.status;
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

        if (filter.actorRole) {
            const admins = await this.adminUsersModel
                .find({ role: filter.actorRole })
                .select('_id')
                .lean()
                .exec();
            query.adminId = { $in: admins.map((a) => a._id) };
        }

        return query;
    }

    private async toListItem(row: Record<string, unknown>): Promise<AdminAuditLogListItemDto> {
        const adminId = row.adminId as Types.ObjectId;
        const admin = await this.adminUsersModel
            .findById(adminId)
            .select('email role')
            .lean()
            .exec();

        return {
            id: String(row._id),
            createdAt: (row.createdAt as Date)?.toISOString?.() ?? '',
            actorId: String(adminId),
            actorEmail: String(admin?.email ?? ''),
            actorRole: String(admin?.role ?? ''),
            action: String(row.action ?? ''),
            entityType: String(row.entity ?? ''),
            entityId: row.entityId ? String(row.entityId) : undefined,
            ip: row.ipAddress ? String(row.ipAddress) : undefined,
            userAgent: row.userAgent ? String(row.userAgent) : undefined,
            status: row.status ? String(row.status) : undefined,
            message: String(row.summary ?? row.description ?? ''),
        };
    }
}
