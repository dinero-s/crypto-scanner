import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

export const TableName = 'perp_tickers';

/** Снимок perpetual-тикера */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class PerpTickerEntity {
    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true })
    exchange: ExchangeEnum;

    @DatabaseProp({ type: String, required: true })
    symbol: string;

    @DatabaseProp({ type: String, required: true })
    baseAsset: string;

    @DatabaseProp({ type: String, required: true })
    quoteAsset: string;

    @DatabaseProp({ type: Number, required: true })
    bid: number;

    @DatabaseProp({ type: Number, required: true })
    ask: number;

    @DatabaseProp({ type: Number, required: true })
    last: number;

    @DatabaseProp({ type: Number, required: true })
    markPrice: number;

    @DatabaseProp({ type: Number, required: true })
    indexPrice: number;

    @DatabaseProp({ type: Number, required: true })
    volume24h: number;

    @DatabaseProp({ type: Number, required: true })
    openInterest: number;

    @DatabaseProp({ type: Number, required: true })
    timestamp: number;
}

export const PerpTickerSchema = DatabaseSchema(PerpTickerEntity);

PerpTickerSchema.index({ exchange: 1, symbol: 1, timestamp: -1 });
PerpTickerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604_800 });

export type PerpTickerDoc = IDatabaseDocument<PerpTickerEntity>;
