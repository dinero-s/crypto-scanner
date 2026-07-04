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

export interface KrakenSpotTickerResponse {
    error: string[];
    result: Record<
        string,
        {
            a: [string, string, string];
            b: [string, string, string];
            c: [string, string];
            v: [string, string];
        }
    >;
}

export interface KrakenAssetPairItem {
    altname: string;
    base: string;
    quote: string;
    status: string;
    pair_decimals: number;
    lot_decimals: number;
    ordermin: string;
}

export interface KrakenAssetPairsResponse {
    error: string[];
    result: Record<string, KrakenAssetPairItem>;
}

export interface KrakenFuturesTickerItem {
    symbol: string;
    last: number;
    bid: number;
    ask: number;
    markPrice: number;
    indexPrice: number;
    vol24h: number;
    openInterest: number;
    fundingRate: number;
    fundingRatePrediction: number;
    nextFundingRateTime: number;
    suspended: boolean;
}

export interface KrakenFuturesTickersResponse {
    result: string;
    tickers: KrakenFuturesTickerItem[];
}

export interface KrakenFuturesInstrumentItem {
    symbol: string;
    type: string;
    base: string;
    quote: string;
    pair: string;
    tradeable: boolean;
    contractSize: number;
    tickSize: number;
}

export interface KrakenFuturesInstrumentsResponse {
    result: string;
    instruments: KrakenFuturesInstrumentItem[];
}

export interface KrakenHistoricalFundingItem {
    timestamp: string;
    fundingRate: number;
    relativeFundingRate: number;
}

export interface KrakenHistoricalFundingResponse {
    result: string;
    rates: KrakenHistoricalFundingItem[];
}

const KRAKEN_ASSET_ALIASES: Record<string, string> = {
    XBT: 'BTC',
    XXBT: 'BTC',
    XETH: 'ETH',
    XXRP: 'XRP',
    ZUSD: 'USD',
    USDT: 'USDT',
    USD: 'USD',
};

const FUNDING_INTERVAL_HOURS = 1;

function normalizeKrakenAsset(asset: string): string {
    return KRAKEN_ASSET_ALIASES[asset] ?? asset.replace(/^X(?=[A-Z]{3})/, '');
}

function parseKrakenSpotPairName(pairName: string): {
    baseAsset: string;
    quoteAsset: string;
} {
    if (pairName.endsWith('USDT')) {
        return {
            baseAsset: normalizeKrakenAsset(pairName.slice(0, -4)),
            quoteAsset: 'USDT',
        };
    }

    if (pairName.endsWith('USD')) {
        return {
            baseAsset: normalizeKrakenAsset(pairName.slice(0, -3)),
            quoteAsset: 'USD',
        };
    }

    return {
        baseAsset: normalizeKrakenAsset(pairName),
        quoteAsset: 'USD',
    };
}

function parseKrakenFuturesSymbol(symbol: string): {
    baseAsset: string;
    quoteAsset: string;
} {
    if (symbol.startsWith('PF_')) {
        const pair = symbol.slice(3);
        if (pair.endsWith('USD')) {
            return {
                baseAsset: normalizeKrakenAsset(pair.slice(0, -3)),
                quoteAsset: 'USD',
            };
        }
    }

    return {
        baseAsset: symbol,
        quoteAsset: 'USD',
    };
}

export function normalizeKrakenSpotTickers(
    tickers: KrakenSpotTickerResponse['result'],
): NormalizedSpotTicker[] {
    return Object.entries(tickers)
        .filter(([pairName]) => pairName.endsWith('USDT') || pairName.endsWith('USD'))
        .map(([pairName, item]) => {
            const { baseAsset, quoteAsset } = parseKrakenSpotPairName(pairName);

            return {
                exchange: ExchangeEnum.KRAKEN,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.b[0]),
                ask: parseExchangeNumber(item.a[0]),
                last: parseExchangeNumber(item.c[0]),
                volume24h: parseExchangeNumber(item.v[1]),
                timestamp: Date.now(),
            };
        });
}

export function normalizeKrakenPerpTickers(
    items: KrakenFuturesTickerItem[],
): NormalizedPerpTicker[] {
    return items
        .filter((item) => item.symbol.startsWith('PF_') && !item.suspended)
        .map((item) => {
            const { baseAsset, quoteAsset } = parseKrakenFuturesSymbol(item.symbol);

            return {
                exchange: ExchangeEnum.KRAKEN,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.bid),
                ask: parseExchangeNumber(item.ask),
                last: parseExchangeNumber(item.last),
                markPrice: parseExchangeNumber(item.markPrice),
                indexPrice: parseExchangeNumber(item.indexPrice),
                volume24h: parseExchangeNumber(item.vol24h),
                openInterest: parseExchangeNumber(item.openInterest),
                timestamp: Date.now(),
            };
        });
}

export function normalizeKrakenFundingRates(
    tickers: KrakenFuturesTickerItem[],
): NormalizedFundingRate[] {
    return tickers
        .filter((item) => item.symbol.startsWith('PF_') && !item.suspended)
        .map((item) => {
            const { baseAsset, quoteAsset } = parseKrakenFuturesSymbol(item.symbol);

            return {
                exchange: ExchangeEnum.KRAKEN,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                fundingRate: parseExchangeNumber(item.fundingRate),
                predictedFundingRate: parseExchangeNumber(item.fundingRatePrediction),
                nextFundingTime: parseExchangeTimestamp(item.nextFundingRateTime),
                fundingIntervalHours: FUNDING_INTERVAL_HOURS,
                timestamp: Date.now(),
            };
        });
}

export function normalizeKrakenOpenInterest(
    items: KrakenFuturesTickerItem[],
): NormalizedOpenInterest[] {
    return items
        .filter((item) => item.symbol.startsWith('PF_') && !item.suspended)
        .map((item) => {
            const { baseAsset, quoteAsset } = parseKrakenFuturesSymbol(item.symbol);

            return {
                exchange: ExchangeEnum.KRAKEN,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                openInterest: parseExchangeNumber(item.openInterest),
                timestamp: Date.now(),
            };
        });
}

export function normalizeKrakenInstruments(
    spotPairs: Record<string, KrakenAssetPairItem>,
    futuresInstruments: KrakenFuturesInstrumentItem[],
): NormalizedInstrument[] {
    const spot = Object.values(spotPairs)
        .filter((item) => item.quote.includes('USDT') || item.altname.endsWith('USDT'))
        .map((item) => {
            const baseAsset = normalizeKrakenAsset(item.base);
            const quoteAsset = normalizeKrakenAsset(item.quote);

            return {
                exchange: ExchangeEnum.KRAKEN,
                marketType: MarketTypeEnum.SPOT,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                status: item.status,
                minQty: parseExchangeNumber(item.ordermin),
            };
        });

    const futures = futuresInstruments
        .filter((item) => item.symbol.startsWith('PF_') && item.tradeable)
        .map((item) => {
            const { baseAsset, quoteAsset } = parseKrakenFuturesSymbol(item.symbol);

            return {
                exchange: ExchangeEnum.KRAKEN,
                marketType: MarketTypeEnum.PERPETUAL,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                status: item.tradeable ? 'TRADING' : 'HALT',
                contractType: item.type,
                tickSize: parseExchangeNumber(item.tickSize),
                stepSize: parseExchangeNumber(item.contractSize),
            };
        });

    return [...spot, ...futures];
}

export function toKrakenSpotNativeSymbol(unifiedSymbol: string): string {
    const [base, quote] = unifiedSymbol.split('/');
    const nativeBase = base === 'BTC' ? 'XBT' : (base ?? unifiedSymbol);

    if (quote === 'USDT') {
        return `${nativeBase}USDT`;
    }

    return `${nativeBase}USD`;
}

export function toKrakenFuturesNativeSymbol(unifiedSymbol: string): string {
    const [base] = unifiedSymbol.split('/');
    const nativeBase = base === 'BTC' ? 'XBT' : (base ?? unifiedSymbol);

    return `PF_${nativeBase}USD`;
}
