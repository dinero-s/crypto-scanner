import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import { OzonMetricsSourceApi } from '../../constants/ozon.enums';

export const CompetitorAnalyticsSnapshotTableName =
    'ozon_competitor_analytics_snapshots';

/** Снимок метрик конкурента из официального API */
@DatabaseEntity({ collection: CompetitorAnalyticsSnapshotTableName, timestamps: true })
export class CompetitorAnalyticsSnapshotEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({
        type: Types.ObjectId,
        ref: 'CompetitorProductEntity',
        required: true,
        index: true,
    })
    competitorProductId: Types.ObjectId;

    @DatabaseProp({ type: Date, required: false, index: true })
    date?: Date;

    @DatabaseProp({ type: Number, required: false })
    price?: number;

    @DatabaseProp({ type: Number, required: false })
    oldPrice?: number;

    @DatabaseProp({ type: Number, required: false })
    discountPercent?: number;

    @DatabaseProp({ type: Number, required: false })
    stock?: number;

    @DatabaseProp({ type: Number, required: false })
    rating?: number;

    @DatabaseProp({ type: Number, required: false })
    reviewsCount?: number;

    @DatabaseProp({ type: String, required: false })
    availability?: string;

    @DatabaseProp({ type: String, required: false })
    sellerName?: string;

    @DatabaseProp({ type: [String], default: [] })
    rawAvailableFields: string[];

    @DatabaseProp({ type: [String], default: [] })
    unavailableFields: string[];

    @DatabaseProp({ type: Date, required: true, index: true })
    collectedAt: Date;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonMetricsSourceApi),
        required: true,
    })
    sourceApi: OzonMetricsSourceApi;
}

export const CompetitorAnalyticsSnapshotSchema = DatabaseSchema(
    CompetitorAnalyticsSnapshotEntity,
);

CompetitorAnalyticsSnapshotSchema.index({
    userId: 1,
    competitorProductId: 1,
    date: -1,
});
CompetitorAnalyticsSnapshotSchema.index({
    competitorProductId: 1,
    collectedAt: -1,
});
CompetitorAnalyticsSnapshotSchema.index(
    { competitorProductId: 1, date: 1 },
    { unique: true, name: 'unique_competitor_snapshot_day' },
);

export type CompetitorAnalyticsSnapshotDoc =
    IDatabaseDocument<CompetitorAnalyticsSnapshotEntity>;
