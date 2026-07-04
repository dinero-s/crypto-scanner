import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

export const TableName = 'market_data_snapshots';

/** Агрегированный снимок market data (bulk) */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class MarketDataSnapshotEntity {
    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true })
    exchange: ExchangeEnum;

    @DatabaseProp({ type: String, required: true })
    snapshotType: string;

    @DatabaseProp({ type: Number, required: true })
    recordCount: number;

    @DatabaseProp({ type: Number, required: true })
    timestamp: number;

    @DatabaseProp({ type: Object, required: true })
    payload: Record<string, unknown>;
}

export const MarketDataSnapshotSchema = DatabaseSchema(MarketDataSnapshotEntity);

MarketDataSnapshotSchema.index({ exchange: 1, snapshotType: 1, timestamp: -1 });
MarketDataSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604_800 });

export type MarketDataSnapshotDoc = IDatabaseDocument<MarketDataSnapshotEntity>;
