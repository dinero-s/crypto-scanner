import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import {
    OzonAuditDataQualityState,
    OzonAuditRunProgressStep,
    OzonAuditRunStatus,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';

export const OzonAuditRunTableName = 'ozon_audit_runs';

/** Запуск Profit Audit Ozon */
@DatabaseEntity({ collection: OzonAuditRunTableName, timestamps: true })
export class OzonAuditRunEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: true, index: true })
    integrationId: Types.ObjectId;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonAuditRunStatus),
        required: true,
        index: true,
    })
    status: OzonAuditRunStatus;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonAuditRunProgressStep),
        required: true,
    })
    progressStep: OzonAuditRunProgressStep;

    @DatabaseProp({ type: Date, required: true })
    periodFrom: Date;

    @DatabaseProp({ type: Date, required: true })
    periodTo: Date;

    @DatabaseProp({ type: Number, required: true })
    periodDays: number;

    @DatabaseProp({ type: String, required: false, index: true })
    jobId?: string;

    @DatabaseProp({ type: Number, required: false })
    dataQualityScore?: number;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonAuditDataQualityState),
        required: false,
    })
    dataQualityState?: OzonAuditDataQualityState;

    /** Снимок data quality после шага DATA_QUALITY (read-path без пересчёта) */
    @DatabaseProp({ type: Object, required: false })
    dataQualitySnapshot?: Record<string, unknown>;

    @DatabaseProp({ type: Number, required: false })
    issuesCount?: number;

    @DatabaseProp({ type: Number, required: false })
    criticalIssuesCount?: number;

    @DatabaseProp({ type: Number, required: false })
    highIssuesCount?: number;

    @DatabaseProp({ type: Number, required: false })
    recommendationsCount?: number;

    @DatabaseProp({ type: Number, required: false })
    estimatedLossMin?: number;

    @DatabaseProp({ type: Number, required: false })
    estimatedLossMax?: number;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonLossCalculationConfidence),
        required: false,
    })
    lossCalculationConfidence?: OzonLossCalculationConfidence;

    @DatabaseProp({ type: String, required: false })
    errorMessage?: string;

    @DatabaseProp({ type: String, required: false })
    errorCode?: string;

    @DatabaseProp({ type: Date, required: false })
    startedAt?: Date;

    @DatabaseProp({ type: Date, required: false })
    finishedAt?: Date;
}

export const OzonAuditRunSchema = DatabaseSchema(OzonAuditRunEntity);

OzonAuditRunSchema.index({ userId: 1, createdAt: -1 });
OzonAuditRunSchema.index({ userId: 1, status: 1, createdAt: -1 });
OzonAuditRunSchema.index({ integrationId: 1, createdAt: -1 });
OzonAuditRunSchema.index({ userId: 1, integrationId: 1, status: 1, createdAt: -1 });
OzonAuditRunSchema.index(
    { userId: 1, integrationId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: {
                $in: [OzonAuditRunStatus.QUEUED, OzonAuditRunStatus.RUNNING],
            },
        },
        name: 'unique_active_audit_run_per_connection',
    },
);

export type OzonAuditRunDoc = IDatabaseDocument<OzonAuditRunEntity>;
