import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

export const TableName = 'market_funding_snapshots';

/** Снимок funding rate */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class FundingRateSnapshotEntity {
    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true, index: true })
    exchange: ExchangeEnum;

    @DatabaseProp({ type: String, required: true, index: true })
    symbol: string;

    @DatabaseProp({ type: String, required: true })
    nativeSymbol: string;

    @DatabaseProp({ type: Number, required: true })
    fundingRate: number;

    @DatabaseProp({ type: Number, default: null })
    predictedFundingRate?: number;

    @DatabaseProp({ type: Number, required: true })
    nextFundingTime: number;

    @DatabaseProp({ type: Number, default: null })
    openInterest?: number;

    @DatabaseProp({ type: Number, default: null })
    openInterestValue?: number;

    @DatabaseProp({ type: Number, required: true })
    quoteTimestamp: number;
}

export const FundingRateSnapshotSchema = DatabaseSchema(FundingRateSnapshotEntity);
export type FundingRateSnapshotDoc = IDatabaseDocument<FundingRateSnapshotEntity>;
