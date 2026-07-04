import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

export const TableName = 'market_futures_snapshots';

/** Снимок futures/perpetual цены */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class FuturesPriceSnapshotEntity {
    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true, index: true })
    exchange: ExchangeEnum;

    @DatabaseProp({ type: String, required: true, index: true })
    symbol: string;

    @DatabaseProp({ type: String, required: true })
    nativeSymbol: string;

    @DatabaseProp({ type: Number, required: true })
    markPrice: number;

    @DatabaseProp({ type: Number, required: true })
    indexPrice: number;

    @DatabaseProp({ type: Number, required: true })
    lastPrice: number;

    @DatabaseProp({ type: Number, required: true })
    quoteTimestamp: number;
}

export const FuturesPriceSnapshotSchema = DatabaseSchema(FuturesPriceSnapshotEntity);
export type FuturesPriceSnapshotDoc = IDatabaseDocument<FuturesPriceSnapshotEntity>;
