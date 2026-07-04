import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import {
    ArbitrageTypeEnum,
    FundingDirectionEnum,
} from '../enums/arbitrage-type.enum';

export const TableName = 'arbitrage_opportunities';

/** Рассчитанная арбитражная возможность */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class ArbitrageOpportunityEntity {
    @DatabaseProp({ type: String, enum: ArbitrageTypeEnum, required: true, index: true })
    type: ArbitrageTypeEnum;

    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true, index: true })
    exchange: ExchangeEnum;

    @DatabaseProp({ type: String, required: true, index: true })
    symbol: string;

    @DatabaseProp({ type: String, enum: FundingDirectionEnum, default: null })
    direction?: FundingDirectionEnum;

    @DatabaseProp({ type: Number, required: true })
    grossYieldPct: number;

    @DatabaseProp({ type: Number, required: true, index: true })
    netYieldPct: number;

    @DatabaseProp({ type: Number, default: null })
    fundingRate?: number;

    @DatabaseProp({ type: Number, default: null })
    basisPct?: number;

    @DatabaseProp({ type: Object, default: {} })
    metadata: Record<string, number | string | boolean>;

    @DatabaseProp({ type: Number, required: true })
    calculatedAt: number;
}

export const ArbitrageOpportunitySchema = DatabaseSchema(ArbitrageOpportunityEntity);
export type ArbitrageOpportunityDoc = IDatabaseDocument<ArbitrageOpportunityEntity>;
