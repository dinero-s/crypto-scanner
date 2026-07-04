import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import { OzonMetricsSourceApi } from '../../constants/ozon.enums';
import {
    DEFAULT_OZON_SNAPSHOT_TTL_DAYS,
    daysToExpireAfterSeconds,
} from '../../constants/retention.constant';

export const ProductAnalyticsSnapshotTableName = 'ozon_product_analytics_snapshots';

/** Снимок аналитики товара продавца */
@DatabaseEntity({ collection: ProductAnalyticsSnapshotTableName, timestamps: true })
export class ProductAnalyticsSnapshotEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: String, required: true, index: true })
    productId: string;

    @DatabaseProp({ type: Number, required: false })
    price?: number;

    @DatabaseProp({ type: Number, required: false })
    stock?: number;

    @DatabaseProp({ type: Number, required: false })
    salesUnits?: number;

    @DatabaseProp({ type: Number, required: false })
    adSpend?: number;

    @DatabaseProp({ type: Number, required: false })
    adClicks?: number;

    @DatabaseProp({ type: Number, required: false })
    adOrders?: number;

    @DatabaseProp({ type: Date, required: true, index: true })
    collectedAt: Date;

    /** Календарный день UTC для dedup upsert */
    @DatabaseProp({ type: Date, required: true, index: true })
    snapshotDay: Date;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonMetricsSourceApi),
        required: true,
    })
    sourceApi: OzonMetricsSourceApi;
}

export const ProductAnalyticsSnapshotSchema = DatabaseSchema(
    ProductAnalyticsSnapshotEntity,
);

ProductAnalyticsSnapshotSchema.index({ productId: 1, collectedAt: -1 });
ProductAnalyticsSnapshotSchema.index({ userId: 1, collectedAt: -1 });
ProductAnalyticsSnapshotSchema.index(
    { userId: 1, productId: 1, snapshotDay: 1, sourceApi: 1 },
    { unique: true },
);
ProductAnalyticsSnapshotSchema.index(
    { collectedAt: 1 },
    {
        expireAfterSeconds: daysToExpireAfterSeconds(DEFAULT_OZON_SNAPSHOT_TTL_DAYS),
        name: 'ttl_product_analytics_snapshots',
    },
);

export type ProductAnalyticsSnapshotDoc =
    IDatabaseDocument<ProductAnalyticsSnapshotEntity>;
