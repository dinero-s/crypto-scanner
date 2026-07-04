import { Injectable } from '@nestjs/common';
import {
    FundingRateResponseDto,
    LatestMarketDataQueryDto,
    PerpTickerResponseDto,
    SpotTickerResponseDto,
} from '../dto/latest-market-data.dto';
import { MarketDataCacheService } from './market-data-cache.service';

/** Сервис чтения latest market data (Redis → fallback Mongo) */
@Injectable()
export class MarketDataQueryService {
    constructor(private readonly cacheService: MarketDataCacheService) {}

    /** Latest spot-тикеры */
    async getLatestSpot(query: LatestMarketDataQueryDto): Promise<SpotTickerResponseDto[]> {
        const tickers = await this.cacheService.getLatestSpot(query.exchange);
        return this.filterAndLimit(tickers, query).map((t) => ({
            exchange: t.exchange,
            symbol: t.symbol,
            bid: t.bid,
            ask: t.ask,
            last: t.last,
            volume24h: t.volume24h,
            timestamp: t.timestamp,
        }));
    }

    /** Latest perp-тикеры */
    async getLatestPerp(query: LatestMarketDataQueryDto): Promise<PerpTickerResponseDto[]> {
        const tickers = await this.cacheService.getLatestPerp(query.exchange);
        return this.filterAndLimit(tickers, query).map((t) => ({
            exchange: t.exchange,
            symbol: t.symbol,
            bid: t.bid,
            ask: t.ask,
            last: t.last,
            markPrice: t.markPrice,
            indexPrice: t.indexPrice,
            openInterest: t.openInterest,
            timestamp: t.timestamp,
        }));
    }

    /** Latest funding rates */
    async getLatestFunding(query: LatestMarketDataQueryDto): Promise<FundingRateResponseDto[]> {
        const rates = await this.cacheService.getLatestFunding(query.exchange);
        return this.filterAndLimit(rates, query).map((r) => ({
            exchange: r.exchange,
            symbol: r.symbol,
            fundingRate: r.fundingRate,
            predictedFundingRate: r.predictedFundingRate,
            nextFundingTime: r.nextFundingTime,
            timestamp: r.timestamp,
        }));
    }

    private filterAndLimit<T extends { symbol: string }>(
        items: T[],
        query: LatestMarketDataQueryDto,
    ): T[] {
        let filtered = items;
        if (query.symbol) {
            filtered = filtered.filter((item) => item.symbol === query.symbol);
        }
        return filtered.slice(0, query.limit ?? 100);
    }
}
