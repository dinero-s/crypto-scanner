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

export interface KucoinApiResponse<T> {
    code: string;
    data: T;
}

export interface KucoinSpotTickerItem {
    symbol: string;
    buy: string;
    sell: string;
    last: string;
    vol: string;
    volValue: string;
}

export interface KucoinSpotSymbolItem {
    symbol: string;
    baseCurrency: string;
    quoteCurrency: string;
    enableTrading: boolean;
    priceIncrement: string;
    baseIncrement: string;
    baseMinSize: string;
    baseMaxSize: string;
}

export interface KucoinFuturesContractItem {
    symbol: string;
    baseCurrency: string;
    quoteCurrency: string;
    status: string;
    tickSize: number;
    lotSize: number;
    fundingFeeRate: number;
    predictedFundingFeeRate: number;
    fundingRateGranularity: number;
    nextFundingRateTime: number;
    openInterest: string;
    markPrice: number;
    indexPrice: number;
    turnoverOf24h: number;
    volumeOf24h: number;
}

export interface KucoinFuturesTickerItem {
    symbol: string;
    bestBidPrice: number;
    bestAskPrice: number;
    price: number;
    volume: number;
}

const KUCOIN_BASE_ALIASES: Record<string, string> = {
    XBT: 'BTC',
};

function normalizeKucoinBaseAsset(baseAsset: string): string {
    return KUCOIN_BASE_ALIASES[baseAsset] ?? baseAsset;
}

function fundingIntervalHours(granularityMs: number): number {
    if (granularityMs <= 0) {
        return 8;
    }

    return Math.round(granularityMs / (60 * 60 * 1000));
}

export function normalizeKucoinSpotTickers(
    items: KucoinSpotTickerItem[],
): NormalizedSpotTicker[] {
    return items
        .filter((item) => item.symbol.endsWith('-USDT'))
        .map((item) => {
            const [baseRaw, quoteAsset = 'USDT'] = item.symbol.split('-');
            const baseAsset = normalizeKucoinBaseAsset(baseRaw ?? item.symbol);

            return {
                exchange: ExchangeEnum.KUCOIN,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.buy),
                ask: parseExchangeNumber(item.sell),
                last: parseExchangeNumber(item.last),
                volume24h: parseExchangeNumber(item.vol),
                timestamp: Date.now(),
            };
        });
}

export function normalizeKucoinPerpTickers(
    contracts: KucoinFuturesContractItem[],
    tickers: KucoinFuturesTickerItem[],
): NormalizedPerpTicker[] {
    const tickerMap = new Map(tickers.map((item) => [item.symbol, item]));

    return contracts
        .filter((item) => item.quoteCurrency === 'USDT' && item.status === 'Open')
        .map((item) => {
            const ticker = tickerMap.get(item.symbol);
            const baseAsset = normalizeKucoinBaseAsset(item.baseCurrency);

            return {
                exchange: ExchangeEnum.KUCOIN,
                symbol: buildUnifiedSymbol(baseAsset, item.quoteCurrency),
                baseAsset,
                quoteAsset: item.quoteCurrency,
                bid: parseExchangeNumber(ticker?.bestBidPrice ?? item.markPrice),
                ask: parseExchangeNumber(ticker?.bestAskPrice ?? item.markPrice),
                last: parseExchangeNumber(ticker?.price ?? item.markPrice),
                markPrice: parseExchangeNumber(item.markPrice),
                indexPrice: parseExchangeNumber(item.indexPrice),
                volume24h: parseExchangeNumber(item.volumeOf24h),
                openInterest: parseExchangeNumber(item.openInterest),
                timestamp: Date.now(),
            };
        });
}

export function normalizeKucoinFundingRates(
    contracts: KucoinFuturesContractItem[],
): NormalizedFundingRate[] {
    return contracts
        .filter((item) => item.quoteCurrency === 'USDT' && item.status === 'Open')
        .map((item) => {
            const baseAsset = normalizeKucoinBaseAsset(item.baseCurrency);

            return {
                exchange: ExchangeEnum.KUCOIN,
                symbol: buildUnifiedSymbol(baseAsset, item.quoteCurrency),
                baseAsset,
                quoteAsset: item.quoteCurrency,
                fundingRate: parseExchangeNumber(item.fundingFeeRate),
                predictedFundingRate: parseExchangeNumber(item.predictedFundingFeeRate),
                nextFundingTime: parseExchangeTimestamp(item.nextFundingRateTime),
                fundingIntervalHours: fundingIntervalHours(item.fundingRateGranularity),
                timestamp: Date.now(),
            };
        });
}

export function normalizeKucoinOpenInterest(
    contracts: KucoinFuturesContractItem[],
): NormalizedOpenInterest[] {
    return contracts
        .filter((item) => item.quoteCurrency === 'USDT' && item.status === 'Open')
        .map((item) => {
            const baseAsset = normalizeKucoinBaseAsset(item.baseCurrency);

            return {
                exchange: ExchangeEnum.KUCOIN,
                symbol: buildUnifiedSymbol(baseAsset, item.quoteCurrency),
                baseAsset,
                quoteAsset: item.quoteCurrency,
                openInterest: parseExchangeNumber(item.openInterest),
                openInterestValue: parseExchangeNumber(item.turnoverOf24h),
                timestamp: Date.now(),
            };
        });
}

export function normalizeKucoinInstruments(
    spotSymbols: KucoinSpotSymbolItem[],
    futuresContracts: KucoinFuturesContractItem[],
): NormalizedInstrument[] {
    const spot = spotSymbols
        .filter((item) => item.quoteCurrency === 'USDT')
        .map((item) => ({
            exchange: ExchangeEnum.KUCOIN,
            marketType: MarketTypeEnum.SPOT,
            symbol: buildUnifiedSymbol(
                normalizeKucoinBaseAsset(item.baseCurrency),
                item.quoteCurrency,
            ),
            baseAsset: normalizeKucoinBaseAsset(item.baseCurrency),
            quoteAsset: item.quoteCurrency,
            status: item.enableTrading ? 'TRADING' : 'HALT',
            tickSize: parseExchangeNumber(item.priceIncrement),
            stepSize: parseExchangeNumber(item.baseIncrement),
            minQty: parseExchangeNumber(item.baseMinSize),
            maxQty: parseExchangeNumber(item.baseMaxSize),
        }));

    const futures = futuresContracts
        .filter((item) => item.quoteCurrency === 'USDT')
        .map((item) => ({
            exchange: ExchangeEnum.KUCOIN,
            marketType: MarketTypeEnum.PERPETUAL,
            symbol: buildUnifiedSymbol(
                normalizeKucoinBaseAsset(item.baseCurrency),
                item.quoteCurrency,
            ),
            baseAsset: normalizeKucoinBaseAsset(item.baseCurrency),
            quoteAsset: item.quoteCurrency,
            status: item.status,
            contractType: 'PERPETUAL',
            tickSize: parseExchangeNumber(item.tickSize),
            stepSize: parseExchangeNumber(item.lotSize),
        }));

    return [...spot, ...futures];
}

export function toKucoinSpotNativeSymbol(unifiedSymbol: string): string {
    const [base, quote] = unifiedSymbol.split('/');
    const nativeBase = base === 'BTC' ? 'BTC' : (base ?? unifiedSymbol);

    return `${nativeBase}-${quote ?? 'USDT'}`;
}

export function toKucoinFuturesNativeSymbol(unifiedSymbol: string): string {
    const [base, quote] = unifiedSymbol.split('/');
    const nativeBase = base === 'BTC' ? 'XBT' : (base ?? unifiedSymbol);

    return `${nativeBase}${quote ?? 'USDT'}M`;
}
