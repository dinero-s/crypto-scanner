import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

export const TableName = 'funding_rates';

/** Снимок funding rate */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class FundingRateEntity {
    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true })
    exchange: ExchangeEnum;

    @DatabaseProp({ type: String, required: true })
    symbol: string;

    @DatabaseProp({ type: String, required: true })
    baseAsset: string;

    @DatabaseProp({ type: String, required: true })
    quoteAsset: string;

    @DatabaseProp({ type: Number, required: true })
    fundingRate: number;

    @DatabaseProp({ type: Number, default: null })
    predictedFundingRate?: number;

    @DatabaseProp({ type: Number, required: true })
    nextFundingTime: number;

    @DatabaseProp({ type: Number, required: true })
    fundingIntervalHours: number;

    @DatabaseProp({ type: Number, required: true })
    timestamp: number;
}

export const FundingRateSchema = DatabaseSchema(FundingRateEntity);

FundingRateSchema.index({ exchange: 1, symbol: 1, timestamp: -1 });
FundingRateSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604_800 });

export type FundingRateDoc = IDatabaseDocument<FundingRateEntity>;
