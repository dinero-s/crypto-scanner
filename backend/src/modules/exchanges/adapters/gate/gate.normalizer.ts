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

export interface GateSpotTickerItem {
    currency_pair: string;
    last: string;
    highest_bid: string;
    lowest_ask: string;
    base_volume: string;
    quote_volume: string;
}

export interface GateFuturesTickerItem {
    contract: string;
    last: string;
    highest_bid: string;
    lowest_ask: string;
    volume_24h: string;
    volume_24h_base: string;
    mark_price: string;
    index_price: string;
    funding_rate: string;
    funding_rate_indicative?: string;
    open_interest: string;
}

export interface GateFundingRateItem {
    t: number;
    r: string;
    contract: string;
}

export interface GateSpotPairItem {
    id: string;
    base: string;
    quote: string;
    trade_status: string;
    min_base_amount: string;
    min_quote_amount: string;
    amount_precision: number;
    precision: number;
}

export interface GateFuturesContractItem {
    name: string;
    type: string;
    quanto_multiplier: string;
    order_size_min: number;
    order_size_max: number;
    order_price_round: string;
    order_size_round: string;
    in_delisting: boolean;
}

const FUNDING_INTERVAL_HOURS = 8;

function parseGatePairId(pairId: string): { baseAsset: string; quoteAsset: string } {
    const parts = pairId.split('_');

    return {
        baseAsset: parts[0] ?? pairId,
        quoteAsset: parts[1] ?? 'USDT',
    };
}

export function normalizeGateSpotTickers(items: GateSpotTickerItem[]): NormalizedSpotTicker[] {
    return items
        .filter((item) => item.currency_pair.endsWith('_USDT'))
        .map((item) => {
            const { baseAsset, quoteAsset } = parseGatePairId(item.currency_pair);

            return {
                exchange: ExchangeEnum.GATE,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.highest_bid),
                ask: parseExchangeNumber(item.lowest_ask),
                last: parseExchangeNumber(item.last),
                volume24h: parseExchangeNumber(item.base_volume),
                timestamp: Date.now(),
            };
        });
}

export function normalizeGatePerpTickers(items: GateFuturesTickerItem[]): NormalizedPerpTicker[] {
    return items
        .filter((item) => item.contract.endsWith('_USDT'))
        .map((item) => {
            const { baseAsset, quoteAsset } = parseGatePairId(item.contract);

            return {
                exchange: ExchangeEnum.GATE,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                bid: parseExchangeNumber(item.highest_bid),
                ask: parseExchangeNumber(item.lowest_ask),
                last: parseExchangeNumber(item.last),
                markPrice: parseExchangeNumber(item.mark_price),
                indexPrice: parseExchangeNumber(item.index_price),
                volume24h: parseExchangeNumber(item.volume_24h_base),
                openInterest: parseExchangeNumber(item.open_interest),
                timestamp: Date.now(),
            };
        });
}

export function normalizeGateFundingRates(
    items: GateFundingRateItem[],
): NormalizedFundingRate[] {
    const latestByContract = new Map<string, GateFundingRateItem>();

    for (const item of items) {
        const existing = latestByContract.get(item.contract);
        if (!existing || item.t > existing.t) {
            latestByContract.set(item.contract, item);
        }
    }

    return Array.from(latestByContract.values())
        .filter((item) => item.contract.endsWith('_USDT'))
        .map((item) => {
            const { baseAsset, quoteAsset } = parseGatePairId(item.contract);

            return {
                exchange: ExchangeEnum.GATE,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                fundingRate: parseExchangeNumber(item.r),
                nextFundingTime: parseExchangeTimestamp(item.t),
                fundingIntervalHours: FUNDING_INTERVAL_HOURS,
                timestamp: Date.now(),
            };
        });
}

export function normalizeGateOpenInterest(
    items: GateFuturesTickerItem[],
): NormalizedOpenInterest[] {
    return items
        .filter((item) => item.contract.endsWith('_USDT'))
        .map((item) => {
            const { baseAsset, quoteAsset } = parseGatePairId(item.contract);

            return {
                exchange: ExchangeEnum.GATE,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                openInterest: parseExchangeNumber(item.open_interest),
                timestamp: Date.now(),
            };
        });
}

export function normalizeGateInstruments(
    spotPairs: GateSpotPairItem[],
    futuresContracts: GateFuturesContractItem[],
): NormalizedInstrument[] {
    const spot = spotPairs
        .filter((item) => item.quote === 'USDT')
        .map((item) => ({
            exchange: ExchangeEnum.GATE,
            marketType: MarketTypeEnum.SPOT,
            symbol: buildUnifiedSymbol(item.base, item.quote),
            baseAsset: item.base,
            quoteAsset: item.quote,
            status: item.trade_status,
            tickSize: Math.pow(10, -item.precision),
            stepSize: Math.pow(10, -item.amount_precision),
            minQty: parseExchangeNumber(item.min_base_amount),
        }));

    const futures = futuresContracts
        .filter((item) => item.name.endsWith('_USDT') && !item.in_delisting)
        .map((item) => {
            const { baseAsset, quoteAsset } = parseGatePairId(item.name);

            return {
                exchange: ExchangeEnum.GATE,
                marketType: MarketTypeEnum.PERPETUAL,
                symbol: buildUnifiedSymbol(baseAsset, quoteAsset),
                baseAsset,
                quoteAsset,
                status: item.in_delisting ? 'delisting' : 'trading',
                contractType: item.type,
                tickSize: parseExchangeNumber(item.order_price_round),
                stepSize: parseExchangeNumber(item.order_size_round),
                minQty: item.order_size_min,
                maxQty: item.order_size_max,
            };
        });

    return [...spot, ...futures];
}

export function toGateNativeSymbol(unifiedSymbol: string): string {
    return unifiedSymbol.replace('/', '_');
}
