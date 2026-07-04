import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import {
    OzonAuditActionType,
    OzonAuditRecommendationStatus,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';

export const OzonAuditRecommendationTableName = 'ozon_audit_recommendations';

/** Рекомендация Profit Audit по обнаруженной проблеме */
@DatabaseEntity({ collection: OzonAuditRecommendationTableName, timestamps: true })
export class OzonAuditRecommendationEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: true, index: true })
    integrationId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonDetectedIssueEntity', required: true, index: true })
    issueId: Types.ObjectId;

    @DatabaseProp({ type: String, required: false, index: true })
    productId?: string;

    @DatabaseProp({ type: String, required: false })
    offerId?: string;

    @DatabaseProp({ type: String, required: false })
    sku?: string;

    @DatabaseProp({ type: Number, required: true })
    priority: number;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonAuditActionType),
        required: true,
    })
    actionType: OzonAuditActionType;

    @DatabaseProp({ type: String, required: true })
    title: string;

    @DatabaseProp({ type: String, required: true })
    description: string;

    @DatabaseProp({ type: [String], required: true })
    steps: string[];

    @DatabaseProp({ type: Number, required: false })
    expectedEffectMin?: number;

    @DatabaseProp({ type: Number, required: false })
    expectedEffectMax?: number;

    @DatabaseProp({ type: Number, required: false })
    estimatedLossMin?: number;

    @DatabaseProp({ type: Number, required: false })
    estimatedLossMax?: number;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonLossCalculationConfidence),
        required: true,
    })
    lossCalculationConfidence: OzonLossCalculationConfidence;

    @DatabaseProp({ type: String, required: false })
    lossExplanation?: string;

    @DatabaseProp({ type: String, required: true, index: true })
    recommendationKey: string;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonAuditRunEntity', required: false })
    auditRunId?: Types.ObjectId;

    @DatabaseProp({ type: String, required: false })
    issueKey?: string;

    @DatabaseProp({ type: Date, required: true })
    periodFrom: Date;

    @DatabaseProp({ type: Date, required: true })
    periodTo: Date;

    @DatabaseProp({ type: Number, required: true, min: 0, max: 1 })
    confidence: number;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonAuditRecommendationStatus),
        default: OzonAuditRecommendationStatus.NEW,
        index: true,
    })
    status: OzonAuditRecommendationStatus;
}

export const OzonAuditRecommendationSchema = DatabaseSchema(
    OzonAuditRecommendationEntity,
);

OzonAuditRecommendationSchema.index({ userId: 1, status: 1, createdAt: -1 });
OzonAuditRecommendationSchema.index({ userId: 1, integrationId: 1, status: 1, createdAt: -1 });
OzonAuditRecommendationSchema.index({ userId: 1, issueId: 1 });
OzonAuditRecommendationSchema.index({ userId: 1, recommendationKey: 1, status: 1 });
OzonAuditRecommendationSchema.index({ userId: 1, productId: 1, status: 1 });

export type OzonAuditRecommendationDoc =
    IDatabaseDocument<OzonAuditRecommendationEntity>;
