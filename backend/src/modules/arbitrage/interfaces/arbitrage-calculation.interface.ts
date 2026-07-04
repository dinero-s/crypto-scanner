import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

/** Конфигурация фильтров арбитража */
export interface ArbitrageFilterConfig {
    minFundingRate: number;
    minNetYield: number;
    maxSpread: number;
    minVolume24h: number;
    allowedExchanges: ExchangeEnum[];
    symbolWhitelist: string[];
    symbolBlacklist: string[];
    defaultPositionSizeUsd: number;
    spotFeeRate: number;
    futuresFeeRate: number;
    defaultSlippage: number;
    opportunityTtlSec: number;
}

/** Входные данные для расчёта funding arb */
export interface FundingArbitrageInput {
    exchange: ExchangeEnum;
    baseAsset: string;
    quoteAsset: string;
    spotSymbol: string;
    futuresSymbol: string;
    spotAsk: number;
    perpBid: number;
    volume24h: number;
    fundingRate: number;
    predictedFundingRate?: number;
    nextFundingTime?: number;
    fundingIntervalHours: number;
}

/** Входные данные для расчёта cash & carry */
export interface CashCarryArbitrageInput {
    exchange: ExchangeEnum;
    baseAsset: string;
    quoteAsset: string;
    spotSymbol: string;
    futuresSymbol: string;
    spotAsk: number;
    perpBid: number;
    volume24h: number;
    fundingRate?: number;
    fundingIntervalHours?: number;
    daysToExpiry?: number;
}

/** Тип арбитражной возможности для расчёта */
export type CalculatedOpportunityType = 'funding' | 'cash_carry';

/** Результат расчёта возможности */
export interface CalculatedOpportunity {
    type: CalculatedOpportunityType;
    baseAsset: string;
    quoteAsset: string;
    spotExchange: ExchangeEnum;
    futuresExchange: ExchangeEnum;
    spotSymbol: string;
    futuresSymbol: string;
    spotPrice: number;
    futuresPrice: number;
    fundingRate?: number;
    predictedFundingRate?: number;
    basisPercent?: number;
    netYieldPercent: number;
    estimatedProfitUsd: number;
    annualizedApr?: number;
    opportunityScore: number;
    riskScore: number;
    nextFundingTime?: number;
    expiresAt?: number;
    metadata: Record<string, number | string | boolean>;
    calculatedAt: number;
}
