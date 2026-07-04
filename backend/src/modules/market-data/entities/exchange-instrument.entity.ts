import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum, MarketTypeEnum } from 'src/modules/exchanges/enums/exchange.enum';

export const TableName = 'exchange_instruments';

/** Справочник торговых инструментов биржи */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class ExchangeInstrumentEntity {
    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true })
    exchange: ExchangeEnum;

    @DatabaseProp({ type: String, enum: MarketTypeEnum, required: true })
    marketType: MarketTypeEnum;

    @DatabaseProp({ type: String, required: true })
    symbol: string;

    @DatabaseProp({ type: String, required: true })
    baseAsset: string;

    @DatabaseProp({ type: String, required: true })
    quoteAsset: string;

    @DatabaseProp({ type: String, required: true })
    status: string;

    @DatabaseProp({ type: String, default: null })
    contractType?: string;

    @DatabaseProp({ type: Number, default: null })
    tickSize?: number;

    @DatabaseProp({ type: Number, default: null })
    stepSize?: number;

    @DatabaseProp({ type: Number, default: null })
    minQty?: number;

    @DatabaseProp({ type: Number, default: null })
    maxQty?: number;
}

export const ExchangeInstrumentSchema = DatabaseSchema(ExchangeInstrumentEntity);

ExchangeInstrumentSchema.index(
    { exchange: 1, marketType: 1, symbol: 1 },
    { unique: true },
);

export type ExchangeInstrumentDoc = IDatabaseDocument<ExchangeInstrumentEntity>;
