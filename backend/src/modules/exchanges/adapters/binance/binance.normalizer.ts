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

export interface BinanceSpotTicker24hr {
    symbol: string;
    lastPrice: string;
    volume: string;
    closeTime: number;
}

export interface BinanceBookTicker {
    symbol: string;
    bidPrice: string;
    askPrice: string;
}

export interface BinanceFuturesTicker24hr {
    symbol: string;
    lastPrice: string;
    volume: string;
    closeTime: number;
}

export interface BinancePremiumIndex {
    symbol: string;
    markPrice: string;
    indexPrice: string;
    lastFundingRate: string;
    nextFundingTime: number;
}

export interface BinanceOpenInterestResponse {
    symbol: string;
    openInterest: string;
    time: number;
}

export interface BinanceSpotSymbolInfo {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    status: string;
    filters: Array<{ filterType: string; tickSize?: string; stepSize?: string; minQty?: string; maxQty?: string }>;
}

export interface BinanceFuturesSymbolInfo {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    status: string;
    contractType: string;
    filters: Array<{ filterType: string; tickSize?: string; stepSize?: string; minQty?: string; maxQty?: string }>;
}

const FUNDING_INTERVAL_HOURS = 8;

export function normalizeBinanceSpotTickers(
    tickers24hr: BinanceSpotTicker24hr[],
    bookTickers: BinanceBookTicker[],
): NormalizedSpotTicker[] {
    const bookMap = new Map(bookTickers.map((item) => [item.symbol, item]));

    return tickers24hr
        .filter((item) => item.symbol.endsWith('USDT'))
        .map((item) => {
            const book = bookMap.get(item.symbol);
            const baseAsset = item.symbol.replace(/USDT$/, '');
            const quoteAsset = 'USDT';

            return {
                exchange: ExchangeEnum.BINANCE,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(book?.bidPrice),
                ask: parseExchangeNumber(book?.askPrice),
                last: parseExchangeNumber(item.lastPrice),
                volume24h: parseExchangeNumber(item.volume),
                timestamp: parseExchangeTimestamp(item.closeTime),
            };
        });
}

export function normalizeBinancePerpTickers(
    tickers24hr: BinanceFuturesTicker24hr[],
    premiumIndex: BinancePremiumIndex[],
): NormalizedPerpTicker[] {
    const premiumMap = new Map(premiumIndex.map((item) => [item.symbol, item]));

    return tickers24hr
        .filter((item) => item.symbol.endsWith('USDT'))
        .map((item) => {
            const premium = premiumMap.get(item.symbol);
            const baseAsset = item.symbol.replace(/USDT$/, '');
            const quoteAsset = 'USDT';

            return {
                exchange: ExchangeEnum.BINANCE,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.lastPrice),
                ask: parseExchangeNumber(item.lastPrice),
                last: parseExchangeNumber(item.lastPrice),
                markPrice: parseExchangeNumber(premium?.markPrice ?? item.lastPrice),
                indexPrice: parseExchangeNumber(premium?.indexPrice ?? item.lastPrice),
                volume24h: parseExchangeNumber(item.volume),
                openInterest: 0,
                timestamp: parseExchangeTimestamp(item.closeTime),
            };
        });
}

export function normalizeBinanceFundingRates(
    premiumIndex: BinancePremiumIndex[],
): NormalizedFundingRate[] {
    return premiumIndex
        .filter((item) => item.symbol.endsWith('USDT'))
        .map((item) => {
            const baseAsset = item.symbol.replace(/USDT$/, '');
            const quoteAsset = 'USDT';

            return {
                exchange: ExchangeEnum.BINANCE,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                fundingRate: parseExchangeNumber(item.lastFundingRate),
                nextFundingTime: parseExchangeTimestamp(item.nextFundingTime),
                fundingIntervalHours: FUNDING_INTERVAL_HOURS,
                timestamp: Date.now(),
            };
        });
}

export function normalizeBinanceOpenInterest(
    items: BinanceOpenInterestResponse[],
): NormalizedOpenInterest[] {
    return items
        .filter((item) => item.symbol.endsWith('USDT'))
        .map((item) => {
            const baseAsset = item.symbol.replace(/USDT$/, '');
            const quoteAsset = 'USDT';

            return {
                exchange: ExchangeEnum.BINANCE,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                openInterest: parseExchangeNumber(item.openInterest),
                timestamp: parseExchangeTimestamp(item.time),
            };
        });
}

function extractFilter(
    filters: BinanceSpotSymbolInfo['filters'],
    filterType: string,
): { tickSize?: number; stepSize?: number; minQty?: number; maxQty?: number } {
    const filter = filters.find((item) => item.filterType === filterType);

    return {
        tickSize: filter?.tickSize ? parseExchangeNumber(filter.tickSize) : undefined,
        stepSize: filter?.stepSize ? parseExchangeNumber(filter.stepSize) : undefined,
        minQty: filter?.minQty ? parseExchangeNumber(filter.minQty) : undefined,
        maxQty: filter?.maxQty ? parseExchangeNumber(filter.maxQty) : undefined,
    };
}

export function normalizeBinanceSpotInstruments(
    symbols: BinanceSpotSymbolInfo[],
): NormalizedInstrument[] {
    return symbols
        .filter((item) => item.quoteAsset === 'USDT')
        .map((item) => {
            const priceFilter = extractFilter(item.filters, 'PRICE_FILTER');
            const lotFilter = extractFilter(item.filters, 'LOT_SIZE');

            return {
                exchange: ExchangeEnum.BINANCE,
                marketType: MarketTypeEnum.SPOT,
                symbol: buildUnifiedSymbol(item.baseAsset, item.quoteAsset),
                baseAsset: item.baseAsset,
                quoteAsset: item.quoteAsset,
                status: item.status,
                tickSize: priceFilter.tickSize,
                stepSize: lotFilter.stepSize,
                minQty: lotFilter.minQty,
                maxQty: lotFilter.maxQty,
            };
        });
}

export function normalizeBinancePerpInstruments(
    symbols: BinanceFuturesSymbolInfo[],
): NormalizedInstrument[] {
    return symbols
        .filter(
            (item) =>
                item.quoteAsset === 'USDT' &&
                item.contractType === 'PERPETUAL' &&
                item.status === 'TRADING',
        )
        .map((item) => {
            const priceFilter = extractFilter(item.filters, 'PRICE_FILTER');
            const lotFilter = extractFilter(item.filters, 'LOT_SIZE');

            return {
                exchange: ExchangeEnum.BINANCE,
                marketType: MarketTypeEnum.PERPETUAL,
                symbol: buildUnifiedSymbol(item.baseAsset, item.quoteAsset),
                baseAsset: item.baseAsset,
                quoteAsset: item.quoteAsset,
                status: item.status,
                contractType: item.contractType,
                tickSize: priceFilter.tickSize,
                stepSize: lotFilter.stepSize,
                minQty: lotFilter.minQty,
                maxQty: lotFilter.maxQty,
            };
        });
}

export function toBinanceNativeSymbol(unifiedSymbol: string): string {
    const [base, quote] = unifiedSymbol.split('/');
    return `${base ?? unifiedSymbol}${quote ?? 'USDT'}`;
}
