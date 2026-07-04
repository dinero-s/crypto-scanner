import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    OzonConnectionAuditAction,
    OzonConnectionAuditStatus,
} from '../../constants/ozon.enums';
import {
    OzonConnectionAuditDoc,
    OzonConnectionAuditEntity,
} from '../entities/ozon-connection-audit.entity';

export interface OzonAuditLogInput {
    userId: string;
    connectionId?: string;
    action: OzonConnectionAuditAction;
    status: OzonConnectionAuditStatus;
    summary?: string;
    ipAddress?: string;
}

/** Аудит подключений Ozon на уровне пользователя */
@Injectable()
export class OzonConnectionAuditService {
    private readonly logger = new Logger(OzonConnectionAuditService.name);

    constructor(
        @DatabaseModel(OzonConnectionAuditEntity.name)
        private readonly auditModel: Model<OzonConnectionAuditDoc>,
    ) {}

    async log(input: OzonAuditLogInput): Promise<OzonConnectionAuditDoc> {
        const record = await this.auditModel.create({
            userId: new Types.ObjectId(input.userId),
            connectionId: input.connectionId
                ? new Types.ObjectId(input.connectionId)
                : undefined,
            action: input.action,
            status: input.status,
            summary: input.summary,
            ipAddress: input.ipAddress,
        });

        this.logger.log(
            `ozon audit userId=${input.userId} action=${input.action} status=${input.status}`,
        );

        return record;
    }

    async listByUser(
        userId: string,
        connectionId?: string,
        limit = 50,
    ): Promise<OzonConnectionAuditDoc[]> {
        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
        };

        if (connectionId) {
            filter.connectionId = new Types.ObjectId(connectionId);
        }

        return this.auditModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    /** Проверка, выполняется ли Profit Audit pipeline */
    async isAuditInProgress(connectionId: string): Promise<boolean> {
        const recent = await this.auditModel
            .find({
                connectionId: new Types.ObjectId(connectionId),
                action: {
                    $in: [
                        OzonConnectionAuditAction.AUDIT_TRIGGERED,
                        OzonConnectionAuditAction.AUDIT_COMPLETED,
                        OzonConnectionAuditAction.SYNC_FAILED,
                    ],
                },
            })
            .sort({ createdAt: -1 })
            .limit(5)
            .exec();

        const lastTriggered = recent.find(
            (r) => r.action === OzonConnectionAuditAction.AUDIT_TRIGGERED,
        );

        if (!lastTriggered) {
            return false;
        }

        const triggeredAt = this.getAuditLogTimestampMs(lastTriggered);

        const completedAfter = recent.some(
            (r) =>
                r.action === OzonConnectionAuditAction.AUDIT_COMPLETED &&
                this.getAuditLogTimestampMs(r) >= triggeredAt,
        );

        if (completedAfter) {
            return false;
        }

        const failedAfter = recent.some(
            (r) =>
                r.action === OzonConnectionAuditAction.SYNC_FAILED &&
                this.getAuditLogTimestampMs(r) >= triggeredAt,
        );

        if (failedAfter) {
            return false;
        }

        const staleMs = 30 * 60 * 1000;
        if (Date.now() - triggeredAt > staleMs) {
            return false;
        }

        return true;
    }

    private getAuditLogTimestampMs(doc: unknown): number {
        if (!doc || typeof doc !== 'object' || !('createdAt' in doc)) {
            return 0;
        }
        const createdAt = (doc as { createdAt?: Date }).createdAt;
        return createdAt instanceof Date ? createdAt.getTime() : 0;
    }
}
