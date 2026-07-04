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

export interface BybitApiResponse<T> {
    retCode: number;
    retMsg: string;
    result: T;
    time: number;
}

export interface BybitTickerItem {
    symbol: string;
    lastPrice: string;
    bid1Price: string;
    ask1Price: string;
    volume24h: string;
    markPrice?: string;
    indexPrice?: string;
    fundingRate?: string;
    nextFundingTime?: string;
    openInterest?: string;
    turnover24h?: string;
}

export interface BybitInstrumentItem {
    symbol: string;
    baseCoin: string;
    quoteCoin: string;
    status: string;
    contractType?: string;
    priceFilter?: { tickSize: string };
    lotSizeFilter?: {
        minOrderQty: string;
        maxOrderQty: string;
        qtyStep: string;
    };
}

const FUNDING_INTERVAL_HOURS = 8;

function splitBybitSymbol(symbol: string): { baseAsset: string; quoteAsset: string } {
    if (symbol.endsWith('USDT')) {
        return {
            baseAsset: symbol.slice(0, -4),
            quoteAsset: 'USDT',
        };
    }

    if (symbol.endsWith('USDC')) {
        return {
            baseAsset: symbol.slice(0, -4),
            quoteAsset: 'USDC',
        };
    }

    return {
        baseAsset: symbol,
        quoteAsset: 'USDT',
    };
}

export function normalizeBybitSpotTickers(
    items: BybitTickerItem[],
    snapshotTime: number,
): NormalizedSpotTicker[] {
    return items
        .filter((item) => item.symbol.endsWith('USDT'))
        .map((item) => {
            const { baseAsset, quoteAsset } = splitBybitSymbol(item.symbol);

            return {
                exchange: ExchangeEnum.BYBIT,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.bid1Price),
                ask: parseExchangeNumber(item.ask1Price),
                last: parseExchangeNumber(item.lastPrice),
                volume24h: parseExchangeNumber(item.volume24h),
                timestamp: parseExchangeTimestamp(snapshotTime),
            };
        });
}

export function normalizeBybitPerpTickers(
    items: BybitTickerItem[],
    snapshotTime: number,
): NormalizedPerpTicker[] {
    return items
        .filter((item) => item.symbol.endsWith('USDT'))
        .map((item) => {
            const { baseAsset, quoteAsset } = splitBybitSymbol(item.symbol);

            return {
                exchange: ExchangeEnum.BYBIT,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.bid1Price),
                ask: parseExchangeNumber(item.ask1Price),
                last: parseExchangeNumber(item.lastPrice),
                markPrice: parseExchangeNumber(item.markPrice ?? item.lastPrice),
                indexPrice: parseExchangeNumber(item.indexPrice ?? item.lastPrice),
                volume24h: parseExchangeNumber(item.volume24h),
                openInterest: parseExchangeNumber(item.openInterest),
                timestamp: parseExchangeTimestamp(snapshotTime),
            };
        });
}

export function normalizeBybitFundingRates(
    items: BybitTickerItem[],
    snapshotTime: number,
): NormalizedFundingRate[] {
    return items
        .filter((item) => item.symbol.endsWith('USDT') && item.fundingRate !== undefined)
        .map((item) => {
            const { baseAsset, quoteAsset } = splitBybitSymbol(item.symbol);

            return {
                exchange: ExchangeEnum.BYBIT,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                fundingRate: parseExchangeNumber(item.fundingRate),
                predictedFundingRate: parseExchangeNumber(item.fundingRate),
                nextFundingTime: parseExchangeTimestamp(item.nextFundingTime),
                fundingIntervalHours: FUNDING_INTERVAL_HOURS,
                timestamp: parseExchangeTimestamp(snapshotTime),
            };
        });
}

export function normalizeBybitOpenInterest(
    items: BybitTickerItem[],
    snapshotTime: number,
): NormalizedOpenInterest[] {
    return items
        .filter((item) => item.symbol.endsWith('USDT'))
        .map((item) => {
            const { baseAsset, quoteAsset } = splitBybitSymbol(item.symbol);

            return {
                exchange: ExchangeEnum.BYBIT,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                openInterest: parseExchangeNumber(item.openInterest),
                openInterestValue: parseExchangeNumber(item.turnover24h),
                timestamp: parseExchangeTimestamp(snapshotTime),
            };
        });
}

export function normalizeBybitInstruments(
    spotItems: BybitInstrumentItem[],
    linearItems: BybitInstrumentItem[],
): NormalizedInstrument[] {
    const spot = spotItems
        .filter((item) => item.quoteCoin === 'USDT')
        .map((item) => ({
            exchange: ExchangeEnum.BYBIT,
            marketType: MarketTypeEnum.SPOT,
            symbol: buildUnifiedSymbol(item.baseCoin, item.quoteCoin),
            baseAsset: item.baseCoin,
            quoteAsset: item.quoteCoin,
            status: item.status,
            tickSize: item.priceFilter
                ? parseExchangeNumber(item.priceFilter.tickSize)
                : undefined,
            stepSize: item.lotSizeFilter
                ? parseExchangeNumber(item.lotSizeFilter.qtyStep)
                : undefined,
            minQty: item.lotSizeFilter
                ? parseExchangeNumber(item.lotSizeFilter.minOrderQty)
                : undefined,
            maxQty: item.lotSizeFilter
                ? parseExchangeNumber(item.lotSizeFilter.maxOrderQty)
                : undefined,
        }));

    const linear = linearItems
        .filter((item) => item.quoteCoin === 'USDT')
        .map((item) => ({
            exchange: ExchangeEnum.BYBIT,
            marketType: MarketTypeEnum.PERPETUAL,
            symbol: buildUnifiedSymbol(item.baseCoin, item.quoteCoin),
            baseAsset: item.baseCoin,
            quoteAsset: item.quoteCoin,
            status: item.status,
            contractType: item.contractType,
            tickSize: item.priceFilter
                ? parseExchangeNumber(item.priceFilter.tickSize)
                : undefined,
            stepSize: item.lotSizeFilter
                ? parseExchangeNumber(item.lotSizeFilter.qtyStep)
                : undefined,
            minQty: item.lotSizeFilter
                ? parseExchangeNumber(item.lotSizeFilter.minOrderQty)
                : undefined,
            maxQty: item.lotSizeFilter
                ? parseExchangeNumber(item.lotSizeFilter.maxOrderQty)
                : undefined,
        }));

    return [...spot, ...linear];
}

export function toBybitNativeSymbol(unifiedSymbol: string): string {
    return unifiedSymbol.replace('/', '');
}
