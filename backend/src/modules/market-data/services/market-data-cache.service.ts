import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import {
    NormalizedFundingRate,
    NormalizedPerpTicker,
    NormalizedSpotTicker,
} from 'src/modules/exchanges/interfaces/normalized-market-data.interface';
import { ExchangeHealthRecord } from '../repositories/exchange-health.repository';

const CACHE_PREFIX = 'scanner:cache';

/** Redis-кэш latest market data */
@Injectable()
export class MarketDataCacheService implements OnModuleDestroy {
    private readonly redis: Redis;

    constructor(private readonly configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get<string>('redis.host') ?? 'localhost',
            port: this.configService.get<number>('redis.port') ?? 6379,
            password: this.configService.get<string>('redis.password'),
            db: this.configService.get<number>('redis.db') ?? 0,
            maxRetriesPerRequest: 2,
        });
    }

    onModuleDestroy(): void {
        this.redis.disconnect();
    }

    /** Сохранить latest spot-тикеры */
    async setLatestSpot(tickers: NormalizedSpotTicker[]): Promise<void> {
        await this.setJson(`${CACHE_PREFIX}:spot:latest`, tickers);
        await this.setByExchange(tickers, `${CACHE_PREFIX}:spot`);
    }

    /** Сохранить latest perp-тикеры */
    async setLatestPerp(tickers: NormalizedPerpTicker[]): Promise<void> {
        await this.setJson(`${CACHE_PREFIX}:perp:latest`, tickers);
        await this.setByExchange(tickers, `${CACHE_PREFIX}:perp`);
    }

    /** Сохранить latest funding rates */
    async setLatestFunding(rates: NormalizedFundingRate[]): Promise<void> {
        await this.setJson(`${CACHE_PREFIX}:funding:latest`, rates);
        await this.setByExchange(rates, `${CACHE_PREFIX}:funding`);
    }

    /** Сохранить latest health statuses */
    async setLatestHealth(statuses: ExchangeHealthRecord[]): Promise<void> {
        await this.setJson(`${CACHE_PREFIX}:health:latest`, statuses);
    }

    /** Сохранить latest opportunities */
    async setLatestOpportunities(opportunities: unknown[]): Promise<void> {
        await this.setJson(`${CACHE_PREFIX}:opportunities:latest`, opportunities);
    }

    /** Получить latest spot-тикеры */
    async getLatestSpot(exchange?: ExchangeEnum): Promise<NormalizedSpotTicker[]> {
        return this.getLatest<NormalizedSpotTicker>('spot', exchange);
    }

    /** Получить latest perp-тикеры */
    async getLatestPerp(exchange?: ExchangeEnum): Promise<NormalizedPerpTicker[]> {
        return this.getLatest<NormalizedPerpTicker>('perp', exchange);
    }

    /** Получить latest funding rates */
    async getLatestFunding(exchange?: ExchangeEnum): Promise<NormalizedFundingRate[]> {
        return this.getLatest<NormalizedFundingRate>('funding', exchange);
    }

    /** Получить latest health statuses */
    async getLatestHealth(): Promise<ExchangeHealthRecord[]> {
        return this.getJson<ExchangeHealthRecord[]>(`${CACHE_PREFIX}:health:latest`) ?? [];
    }

    /** Получить latest opportunities */
    async getLatestOpportunities<T>(): Promise<T[]> {
        return this.getJson<T[]>(`${CACHE_PREFIX}:opportunities:latest`) ?? [];
    }

    private async getLatest<T>(
        type: string,
        exchange?: ExchangeEnum,
    ): Promise<T[]> {
        if (exchange) {
            return this.getJson<T[]>(`${CACHE_PREFIX}:${type}:${exchange}`) ?? [];
        }
        return this.getJson<T[]>(`${CACHE_PREFIX}:${type}:latest`) ?? [];
    }

    private async setByExchange<T extends { exchange: ExchangeEnum }>(
        items: T[],
        prefix: string,
    ): Promise<void> {
        const grouped = new Map<ExchangeEnum, T[]>();
        for (const item of items) {
            const list = grouped.get(item.exchange) ?? [];
            list.push(item);
            grouped.set(item.exchange, list);
        }

        const ttl = this.getTtlSec();
        await Promise.all(
            Array.from(grouped.entries()).map(([exchange, data]) =>
                this.redis.set(`${prefix}:${exchange}`, JSON.stringify(data), 'EX', ttl),
            ),
        );
    }

    private async setJson(key: string, value: unknown): Promise<void> {
        const ttl = this.getTtlSec();
        await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    }

    private async getJson<T>(key: string): Promise<T | null> {
        const raw = await this.redis.get(key);
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as T;
    }

    private getTtlSec(): number {
        return this.configService.get<number>('scanner.marketDataCacheTtlSec') ?? 60;
    }
}
