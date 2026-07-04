import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import {
    CompetitorMarketplace,
    CompetitorProductStatus,
} from '../../constants/ozon.enums';

export const CompetitorProductTableName = 'ozon_competitor_products';

/** Товар конкурента для мониторинга через официальный API */
@DatabaseEntity({ collection: CompetitorProductTableName, timestamps: true })
export class CompetitorProductEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: true, index: true })
    connectionId: Types.ObjectId;

    @DatabaseProp({ type: String, required: false, index: true })
    url?: string;

    @DatabaseProp({
        type: String,
        enum: Object.values(CompetitorMarketplace),
        default: CompetitorMarketplace.OZON,
    })
    marketplace: CompetitorMarketplace;

    @DatabaseProp({ type: String, default: 'ozon' })
    source: string;

    @DatabaseProp({ type: String, required: false, index: true })
    externalProductId?: string;

    @DatabaseProp({ type: String, required: false, index: true })
    productId?: string;

    @DatabaseProp({ type: String, required: false, index: true })
    sku?: string;

    @DatabaseProp({ type: String, required: false })
    offerId?: string;

    @DatabaseProp({ type: String, required: false })
    urlReference?: string;

    @DatabaseProp({ type: String, required: false })
    name?: string;

    @DatabaseProp({ type: String, required: false })
    title?: string;

    @DatabaseProp({ type: String, required: false })
    sellerName?: string;

    @DatabaseProp({ type: String, required: false })
    brand?: string;

    @DatabaseProp({ type: String, required: false })
    category?: string;

    @DatabaseProp({
        type: String,
        enum: Object.values(CompetitorProductStatus),
        default: CompetitorProductStatus.ACTIVE,
        index: true,
    })
    status: CompetitorProductStatus;

    @DatabaseProp({ type: Number, required: false })
    lastPrice?: number;

    @DatabaseProp({ type: Number, required: false })
    lastOldPrice?: number;

    @DatabaseProp({ type: Number, required: false })
    lastRating?: number;

    @DatabaseProp({ type: Number, required: false })
    lastReviewsCount?: number;

    @DatabaseProp({ type: String, required: false })
    lastAvailability?: string;

    @DatabaseProp({ type: Date, required: false })
    lastSyncedAt?: Date;

    @DatabaseProp({ type: String, required: false })
    lastError?: string;
}

export const CompetitorProductSchema = DatabaseSchema(CompetitorProductEntity);

CompetitorProductSchema.index({ userId: 1, connectionId: 1 });
CompetitorProductSchema.index({ userId: 1, status: 1 });
CompetitorProductSchema.index(
    { userId: 1, url: 1 },
    {
        unique: true,
        partialFilterExpression: { url: { $type: 'string' }, status: { $ne: 'paused' } },
    },
);
CompetitorProductSchema.index({ userId: 1, externalProductId: 1 });
CompetitorProductSchema.index({ productId: 1 });
CompetitorProductSchema.index({ createdAt: -1 });

export type CompetitorProductDoc = IDatabaseDocument<CompetitorProductEntity>;
