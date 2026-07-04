import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import {
    OzonSeverity,
    RecommendationStatus,
    RecommendationType,
} from '../../constants/ozon.enums';

export const RecommendationTableName = 'ozon_recommendations';

/** AI/аналитическая рекомендация для продавца */
@DatabaseEntity({ collection: RecommendationTableName, timestamps: true })
export class RecommendationEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: String, enum: Object.values(RecommendationType), required: true, index: true })
    type: RecommendationType;

    @DatabaseProp({ type: String, enum: Object.values(OzonSeverity), required: true, index: true })
    severity: OzonSeverity;

    @DatabaseProp({ type: String, required: false, index: true })
    productId?: string;

    @DatabaseProp({ type: String, required: true })
    title: string;

    @DatabaseProp({ type: String, required: true })
    reason: string;

    @DatabaseProp({ type: Object, required: true })
    evidence: Record<string, unknown>;

    @DatabaseProp({ type: String, required: true })
    recommendedAction: string;

    @DatabaseProp({ type: Number, required: true, min: 0, max: 1 })
    confidence: number;

    @DatabaseProp({
        type: String,
        enum: Object.values(RecommendationStatus),
        default: RecommendationStatus.OPEN,
    })
    status: RecommendationStatus;

    @DatabaseProp({ type: Date, required: false })
    resolvedAt?: Date;
}

export const RecommendationSchema = DatabaseSchema(RecommendationEntity);

RecommendationSchema.index({ userId: 1, severity: 1, createdAt: -1 });
RecommendationSchema.index({ userId: 1, type: 1 });
RecommendationSchema.index({ productId: 1 });

export type RecommendationDoc = IDatabaseDocument<RecommendationEntity>;
