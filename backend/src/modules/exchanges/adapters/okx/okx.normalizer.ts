import { ExchangeEnum, MarketTypeEnum } from '../../enums/exchange.enum';
import {
    NormalizedFundingRate,
    NormalizedInstrument,
    NormalizedOpenInterest,
    NormalizedPerpTicker,
    NormalizedSpotTicker,
} from '../../interfaces/normalized-market-data.interface';
import {
    buildUnifiedSymbol,
    parseExchangeNumber,
    parseExchangeTimestamp,
} from '../../utils/exchange-parse.util';

export interface OkxApiResponse<T> {
    code: string;
    msg: string;
    data: T;
}

export interface OkxTickerItem {
    instId: string;
    last: string;
    bidPx: string;
    askPx: string;
    vol24h: string;
    ts: string;
}

export interface OkxFundingRateItem {
    instId: string;
    fundingRate: string;
    nextFundingRate?: string;
    nextFundingTime: string;
    fundingTime: string;
}

export interface OkxOpenInterestItem {
    instId: string;
    oi: string;
    oiCcy: string;
    ts: string;
}

export interface OkxInstrumentItem {
    instId: string;
    instType: string;
    baseCcy: string;
    quoteCcy: string;
    state: string;
    ctType?: string;
    tickSz: string;
    lotSz: string;
    minSz: string;
    maxLmtSz?: string;
}

const FUNDING_INTERVAL_HOURS = 8;

function parseOkxSwapSymbol(instId: string): {
    baseAsset: string;
    quoteAsset: string;
} {
    const parts = instId.split('-');

    return {
        baseAsset: parts[0] ?? instId,
        quoteAsset: parts[1] ?? 'USDT',
    };
}

function parseOkxSpotSymbol(item: OkxTickerItem): {
    baseAsset: string;
    quoteAsset: string;
} {
    const parts = item.instId.split('-');

    return {
        baseAsset: parts[0] ?? item.instId,
        quoteAsset: parts[1] ?? 'USDT',
    };
}

export function normalizeOkxSpotTickers(items: OkxTickerItem[]): NormalizedSpotTicker[] {
    return items
        .filter((item) => item.instId.endsWith('-USDT'))
        .map((item) => {
            const { baseAsset, quoteAsset } = parseOkxSpotSymbol(item);

            return {
                exchange: ExchangeEnum.OKX,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.bidPx),
                ask: parseExchangeNumber(item.askPx),
                last: parseExchangeNumber(item.last),
                volume24h: parseExchangeNumber(item.vol24h),
                timestamp: parseExchangeTimestamp(item.ts),
            };
        });
}

export function normalizeOkxPerpTickers(items: OkxTickerItem[]): NormalizedPerpTicker[] {
    return items
        .filter((item) => item.instId.endsWith('-USDT-SWAP'))
        .map((item) => {
            const { baseAsset, quoteAsset } = parseOkxSwapSymbol(item.instId);

            return {
                exchange: ExchangeEnum.OKX,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.bidPx),
                ask: parseExchangeNumber(item.askPx),
                last: parseExchangeNumber(item.last),
                markPrice: parseExchangeNumber(item.last),
                indexPrice: parseExchangeNumber(item.last),
                volume24h: parseExchangeNumber(item.vol24h),
                openInterest: 0,
                timestamp: parseExchangeTimestamp(item.ts),
            };
        });
}

export function normalizeOkxFundingRates(items: OkxFundingRateItem[]): NormalizedFundingRate[] {
    return items
        .filter((item) => item.instId.endsWith('-USDT-SWAP'))
        .map((item) => {
            const { baseAsset, quoteAsset } = parseOkxSwapSymbol(item.instId);

            return {
                exchange: ExchangeEnum.OKX,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                fundingRate: parseExchangeNumber(item.fundingRate),
                predictedFundingRate: item.nextFundingRate
                    ? parseExchangeNumber(item.nextFundingRate)
                    : undefined,
                nextFundingTime: parseExchangeTimestamp(item.nextFundingTime),
                fundingIntervalHours: FUNDING_INTERVAL_HOURS,
                timestamp: parseExchangeTimestamp(item.fundingTime),
            };
        });
}

export function normalizeOkxOpenInterest(items: OkxOpenInterestItem[]): NormalizedOpenInterest[] {
    return items
        .filter((item) => item.instId.endsWith('-USDT-SWAP'))
        .map((item) => {
            const { baseAsset, quoteAsset } = parseOkxSwapSymbol(item.instId);

            return {
                exchange: ExchangeEnum.OKX,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                openInterest: parseExchangeNumber(item.oi),
                openInterestValue: parseExchangeNumber(item.oiCcy),
                timestamp: parseExchangeTimestamp(item.ts),
            };
        });
}

export function normalizeOkxInstruments(items: OkxInstrumentItem[]): NormalizedInstrument[] {
    return items
        .filter(
            (item) =>
                (item.instType === 'SPOT' && item.quoteCcy === 'USDT') ||
                (item.instType === 'SWAP' && item.instId.endsWith('-USDT-SWAP')),
        )
        .map((item) => {
            const marketType =
                item.instType === 'SPOT' ? MarketTypeEnum.SPOT : MarketTypeEnum.PERPETUAL;

            return {
                exchange: ExchangeEnum.OKX,
                marketType,
                symbol: buildUnifiedSymbol(item.baseCcy, item.quoteCcy),
                baseAsset: item.baseCcy,
                quoteAsset: item.quoteCcy,
                status: item.state,
                contractType: item.ctType,
                tickSize: parseExchangeNumber(item.tickSz),
                stepSize: parseExchangeNumber(item.lotSz),
                minQty: parseExchangeNumber(item.minSz),
                maxQty: item.maxLmtSz ? parseExchangeNumber(item.maxLmtSz) : undefined,
            };
        });
}

export function toOkxNativeSymbol(unifiedSymbol: string, marketType: MarketTypeEnum): string {
    const [base, quote] = unifiedSymbol.split('/');

    if (marketType === MarketTypeEnum.PERPETUAL) {
        return `${base ?? unifiedSymbol}-${quote ?? 'USDT'}-SWAP`;
    }

    return `${base ?? unifiedSymbol}-${quote ?? 'USDT'}`;
}
