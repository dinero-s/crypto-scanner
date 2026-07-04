import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import {
    DEFAULT_OZON_SNAPSHOT_TTL_DAYS,
    daysToExpireAfterSeconds,
} from '../../constants/retention.constant';

export const OzonMetricSnapshotTableName = 'ozon_metric_snapshots';

/** Дневной снимок метрик товара для Profit Audit */
@DatabaseEntity({ collection: OzonMetricSnapshotTableName, timestamps: true })
export class OzonMetricSnapshotEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: true, index: true })
    integrationId: Types.ObjectId;

    @DatabaseProp({ type: String, required: true, index: true })
    productId: string;

    @DatabaseProp({ type: String, required: false, index: true })
    offerId?: string;

    @DatabaseProp({ type: String, required: false })
    sku?: string;

    @DatabaseProp({ type: Date, required: true, index: true })
    date: Date;

    @DatabaseProp({ type: Number, required: false })
    revenue?: number;

    @DatabaseProp({ type: Number, required: false })
    ordersCount?: number;

    @DatabaseProp({ type: Number, required: false })
    unitsSold?: number;

    @DatabaseProp({ type: Number, required: false })
    stockAvailable?: number;

    @DatabaseProp({ type: Number, required: false })
    stockDaysLeft?: number;

    @DatabaseProp({ type: Number, required: false })
    price?: number;

    @DatabaseProp({ type: Number, required: false })
    oldPrice?: number;

    @DatabaseProp({ type: Number, required: false })
    discountPercent?: number;

    @DatabaseProp({ type: Number, required: false })
    adSpend?: number;

    @DatabaseProp({ type: Number, required: false })
    adOrders?: number;

    @DatabaseProp({ type: Number, required: false })
    drr?: number;

    @DatabaseProp({ type: Number, required: false })
    acos?: number;

    @DatabaseProp({ type: Number, required: false })
    returnsCount?: number;

    @DatabaseProp({ type: Number, required: false })
    returnsRate?: number;

    @DatabaseProp({ type: Number, required: false })
    grossProfitEstimate?: number;

    @DatabaseProp({ type: Number, required: false })
    marginPercent?: number;

    @DatabaseProp({ type: Number, required: false })
    views?: number;

    @DatabaseProp({ type: Number, required: false })
    clicks?: number;

    @DatabaseProp({ type: Number, required: false })
    ctr?: number;

    @DatabaseProp({ type: Number, required: false })
    conversionRate?: number;
}

export const OzonMetricSnapshotSchema = DatabaseSchema(OzonMetricSnapshotEntity);

OzonMetricSnapshotSchema.index({ userId: 1, date: -1 });
OzonMetricSnapshotSchema.index({ userId: 1, offerId: 1, date: -1 });
OzonMetricSnapshotSchema.index({ integrationId: 1, date: -1 });
OzonMetricSnapshotSchema.index(
    { integrationId: 1, productId: 1, date: 1 },
    { unique: true },
);
OzonMetricSnapshotSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: daysToExpireAfterSeconds(DEFAULT_OZON_SNAPSHOT_TTL_DAYS),
        name: 'ttl_ozon_metric_snapshots',
    },
);

export type OzonMetricSnapshotDoc = IDatabaseDocument<OzonMetricSnapshotEntity>;
