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
    TradeVerdictEnum,
} from '../enums/arbitrage-type.enum';

export const TableName = 'arbitrage_opportunities';

/** Дополнительные метрики возможности */
export interface ArbitrageOpportunityMetadata {
    direction?: FundingDirectionEnum;
    spotPerpSpreadPercent?: number;
    estimatedFeesPercent?: number;
    estimatedSlippagePercent?: number;
    timeToFundingMinutes?: number;
    isTheoreticalApr?: boolean;
    volume24h?: number;
    grossYieldPercent?: number;
    netFundingPercent?: number;
    entrySpreadImpactPercent?: number;
    totalNetAfterEntryPercent?: number;
    tradeVerdict?: TradeVerdictEnum;
}

/** Рассчитанная арбитражная возможность */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class ArbitrageOpportunityEntity {
    @DatabaseProp({ type: String, enum: ArbitrageTypeEnum, required: true, index: true })
    type: ArbitrageTypeEnum;

    @DatabaseProp({ type: String, required: true, index: true })
    baseAsset: string;

    @DatabaseProp({ type: String, required: true, index: true })
    quoteAsset: string;

    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true, index: true })
    spotExchange: ExchangeEnum;

    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true, index: true })
    futuresExchange: ExchangeEnum;

    @DatabaseProp({ type: String, required: true })
    spotSymbol: string;

    @DatabaseProp({ type: String, required: true })
    futuresSymbol: string;

    @DatabaseProp({ type: Number, required: true })
    spotPrice: number;

    @DatabaseProp({ type: Number, required: true })
    futuresPrice: number;

    @DatabaseProp({ type: Number, default: null })
    fundingRate?: number;

    @DatabaseProp({ type: Number, default: null })
    predictedFundingRate?: number;

    @DatabaseProp({ type: Number, default: null })
    basisPercent?: number;

    @DatabaseProp({ type: Number, required: true, index: true })
    netYieldPercent: number;

    @DatabaseProp({ type: Number, required: true })
    estimatedProfitUsd: number;

    @DatabaseProp({ type: Number, default: null })
    annualizedApr?: number;

    @DatabaseProp({ type: Number, required: true, index: true })
    opportunityScore: number;

    @DatabaseProp({ type: Number, required: true })
    riskScore: number;

    @DatabaseProp({ type: Number, default: null })
    nextFundingTime?: number;

    @DatabaseProp({ type: Number, default: null })
    expiresAt?: number;

    @DatabaseProp({ type: Object, default: {} })
    metadata: ArbitrageOpportunityMetadata;

    @DatabaseProp({ type: Number, required: true, index: true })
    calculatedAt: number;
}

export const ArbitrageOpportunitySchema = DatabaseSchema(ArbitrageOpportunityEntity);

ArbitrageOpportunitySchema.index(
    { type: 1, spotExchange: 1, spotSymbol: 1 },
    { unique: true, name: 'type_exchange_symbol_unique' },
);
ArbitrageOpportunitySchema.index(
    { type: 1, spotExchange: 1, spotSymbol: 1, calculatedAt: -1 },
    { name: 'type_exchange_symbol_calc' },
);
ArbitrageOpportunitySchema.index({ opportunityScore: -1, calculatedAt: -1 });
ArbitrageOpportunitySchema.index({ calculatedAt: 1 }, { expireAfterSeconds: 86_400 });

export type ArbitrageOpportunityDoc = IDatabaseDocument<ArbitrageOpportunityEntity>;
