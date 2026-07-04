import { ExchangeEnum, MarketTypeEnum } from '../enums/exchange.enum';

/** Нормализованный spot-тикер */
export interface NormalizedSpotTicker {
    exchange: ExchangeEnum;
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    bid: number;
    ask: number;
    last: number;
    volume24h: number;
    timestamp: number;
}

/** Нормализованный perpetual-тикер */
export interface NormalizedPerpTicker {
    exchange: ExchangeEnum;
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    bid: number;
    ask: number;
    last: number;
    markPrice: number;
    indexPrice: number;
    volume24h: number;
    openInterest: number;
    timestamp: number;
}

/** Источник nextFundingTime */
export type NextFundingTimeSource = 'exchange' | 'estimated';

/** Источник predictedFundingRate */
export type PredictedFundingRateSource = 'exchange' | 'fallback';

/** Нормализованный funding rate */
export interface NormalizedFundingRate {
    exchange: ExchangeEnum;
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    fundingRate: number;
    predictedFundingRate?: number | null;
    predictedFundingRateSource?: PredictedFundingRateSource | null;
    nextFundingTime?: number | null;
    nextFundingTimeSource?: NextFundingTimeSource | null;
    fundingIntervalHours: number;
    timestamp: number;
}

/** Нормализованный open interest */
export interface NormalizedOpenInterest {
    exchange: ExchangeEnum;
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    openInterest: number | null;
    openInterestAvailable?: boolean;
    openInterestSource?: 'exchange' | null;
    openInterestValue?: number;
    timestamp: number;
}

/** Нормализованный инструмент */
export interface NormalizedInstrument {
    exchange: ExchangeEnum;
    marketType: MarketTypeEnum;
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    status: string;
    contractType?: string;
    tickSize?: number;
    stepSize?: number;
    minQty?: number;
    maxQty?: number;
}
