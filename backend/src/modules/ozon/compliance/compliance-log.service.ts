import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { ComplianceLogEvent } from '../constants/ozon.enums';
import {
    ComplianceDecision,
    MarketplaceType,
} from 'src/modules/admin-panel/enums/admin-panel.enum';
import {
    ComplianceLogDoc,
    ComplianceLogEntity,
} from 'src/modules/admin-panel/entities/compliance-log.entity';

export interface ComplianceLogPayload {
    event: ComplianceLogEvent;
    userId?: string;
    connectionId?: string;
    endpoint?: string;
    requestHost?: string;
    method?: string;
    details?: string;
    errorCode?: string;
}

/** Compliance-safe логирование с persist в MongoDB */
@Injectable()
export class ComplianceLogService {
    private readonly logger = new Logger(ComplianceLogService.name);

    constructor(
        @DatabaseModel(ComplianceLogEntity.name)
        private readonly complianceLogModel: Model<ComplianceLogDoc>,
    ) {}

    log(payload: ComplianceLogPayload): void {
        const parts = [
            `event=${payload.event}`,
            payload.userId ? `userId=${payload.userId}` : null,
            payload.connectionId ? `connectionId=${payload.connectionId}` : null,
            payload.endpoint ? `endpoint=${payload.endpoint}` : null,
            payload.details ? `details=${payload.details}` : null,
        ].filter((part): part is string => part !== null);

        this.logger.warn(parts.join(' '));

        void this.persist(payload).catch(() => undefined);
    }

    private async persist(payload: ComplianceLogPayload): Promise<void> {
        const blockedEvents = new Set<ComplianceLogEvent>([
            ComplianceLogEvent.BLOCKED_FORBIDDEN_ENDPOINT,
            ComplianceLogEvent.BLOCKED_HTML_SCRAPING_ATTEMPT,
            ComplianceLogEvent.BLOCKED_UNSUPPORTED_DATA_REQUEST,
        ]);

        const decision = blockedEvents.has(payload.event)
            ? ComplianceDecision.BLOCKED
            : payload.event === ComplianceLogEvent.DATA_NOT_AVAILABLE
              ? ComplianceDecision.SKIPPED
              : ComplianceDecision.UNKNOWN;

        const requestHost =
            payload.requestHost ??
            (payload.endpoint ? this.extractHost(payload.endpoint) : undefined);

        await this.complianceLogModel.create({
            marketplace: MarketplaceType.OZON,
            userId: payload.userId
                ? new Types.ObjectId(payload.userId)
                : undefined,
            connectionId: payload.connectionId
                ? new Types.ObjectId(payload.connectionId)
                : undefined,
            action: payload.event,
            requestHost,
            endpoint: payload.endpoint,
            method: payload.method,
            decision,
            reason: payload.details,
            blocked: decision === ComplianceDecision.BLOCKED,
            errorCode: payload.errorCode,
        });
    }

    private extractHost(endpoint: string): string | undefined {
        try {
            if (endpoint.startsWith('http')) {
                return new URL(endpoint).host;
            }
            return endpoint.split('/')[0] ?? endpoint;
        } catch {
            return endpoint;
        }
    }
}
