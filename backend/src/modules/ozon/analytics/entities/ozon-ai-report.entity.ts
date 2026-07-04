import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import { OzonAiReportType } from '../../constants/ozon.enums';
import {
    DEFAULT_OZON_AI_REPORT_TTL_DAYS,
    daysToExpireAfterSeconds,
} from '../../constants/retention.constant';

export const OzonAiReportTableName = 'ozon_ai_reports';

/** AI-отчёт Profit Audit (факты + текст LLM) */
@DatabaseEntity({ collection: OzonAiReportTableName, timestamps: true })
export class OzonAiReportEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: true, index: true })
    integrationId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonAuditRunEntity', required: false })
    auditRunId?: Types.ObjectId;

    @DatabaseProp({ type: Date, required: true })
    periodFrom: Date;

    @DatabaseProp({ type: Date, required: true })
    periodTo: Date;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonAiReportType),
        required: true,
        index: true,
    })
    type: OzonAiReportType;

    @DatabaseProp({ type: Object, required: true })
    facts: Record<string, unknown>;

    @DatabaseProp({ type: String, required: true })
    aiText: string;

    @DatabaseProp({ type: String, required: false })
    modelName?: string;

    @DatabaseProp({ type: String, required: false })
    promptVersion?: string;
}

export const OzonAiReportSchema = DatabaseSchema(OzonAiReportEntity);

OzonAiReportSchema.index({ userId: 1, type: 1, createdAt: -1 });
OzonAiReportSchema.index({ integrationId: 1, createdAt: -1 });
OzonAiReportSchema.index({ auditRunId: 1 });
OzonAiReportSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: daysToExpireAfterSeconds(DEFAULT_OZON_AI_REPORT_TTL_DAYS),
        name: 'ttl_ozon_ai_reports',
    },
);

export type OzonAiReportDoc = IDatabaseDocument<OzonAiReportEntity>;
