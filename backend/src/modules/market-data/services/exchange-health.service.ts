import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { ExchangeHealthRepository } from '../repositories/exchange-health.repository';
import { MarketDataCacheService } from './market-data-cache.service';

/** Сервис обновления health-статусов бирж */
@Injectable()
export class ExchangeHealthService {
    private readonly logger = new Logger(ExchangeHealthService.name);

    constructor(
        private readonly healthRepository: ExchangeHealthRepository,
        private readonly cacheService: MarketDataCacheService,
        private readonly registry: ExchangeRegistryService,
        private readonly configService: ConfigService,
    ) {}

    /** Записать результат попытки сбора данных с биржи */
    async recordAttempt(
        exchange: ExchangeEnum,
        success: boolean,
        latencyMs: number,
        error?: string,
    ): Promise<void> {
        const now = new Date();
        await this.healthRepository.upsertStatus({
            exchange,
            healthy: success,
            lastCheckedAt: now,
            lastSuccessAt: success ? now : undefined,
            lastError: success ? undefined : error,
            latencyMs,
        });
    }

    /** Обновить Redis-кэш health после записи */
    async refreshCache(): Promise<void> {
        const statuses = await this.healthRepository.findAll();
        const records = statuses.map((s) => ({
            exchange: s.exchange,
            healthy: s.healthy,
            lastCheckedAt: s.lastCheckedAt,
            lastSuccessAt: s.lastSuccessAt,
            lastError: s.lastError,
            latencyMs: s.latencyMs,
        }));
        await this.cacheService.setLatestHealth(records);
    }

    /** Получить статусы всех включённых бирж */
    async getAllStatuses(): Promise<
        Array<{
            exchange: ExchangeEnum;
            healthy: boolean;
            lastCheckedAt: Date;
            lastSuccessAt?: Date;
            lastError?: string;
            latencyMs?: number;
        }>
    > {
        const cached = await this.cacheService.getLatestHealth();
        if (cached.length > 0) {
            return cached;
        }

        const rows = await this.healthRepository.findAll();
        return rows.map((s) => ({
            exchange: s.exchange,
            healthy: s.healthy,
            lastCheckedAt: s.lastCheckedAt,
            lastSuccessAt: s.lastSuccessAt,
            lastError: s.lastError,
            latencyMs: s.latencyMs,
        }));
    }

    /** Сбор данных по каждой бирже с обновлением health */
    async collectPerExchange<T>(
        fetcher: (exchange: ExchangeEnum) => Promise<T[]>,
        method: string,
    ): Promise<T[]> {
        const exchanges = this.getEnabledExchanges();
        const results: T[] = [];

        await Promise.all(
            exchanges.map(async (exchange) => {
                const started = Date.now();
                try {
                    const data = await fetcher(exchange);
                    const latencyMs = Date.now() - started;
                    await this.recordAttempt(exchange, true, latencyMs);
                    results.push(...data);
                } catch (error) {
                    const latencyMs = Date.now() - started;
                    const message = error instanceof Error ? error.message : 'unknown error';
                    this.logger.error(
                        `exchange=${exchange} method=${method} message=${message}`,
                    );
                    await this.recordAttempt(exchange, false, latencyMs, message);
                }
            }),
        );

        await this.refreshCache();
        return results;
    }

    /** Список включённых бирж из конфига */
    getEnabledExchanges(): ExchangeEnum[] {
        const configured = this.configService.get<string[]>('scanner.enabledExchanges');
        if (configured && configured.length > 0) {
            return configured.filter((e) =>
                this.registry.getSupportedExchanges().includes(e as ExchangeEnum),
            ) as ExchangeEnum[];
        }
        return this.registry.getSupportedExchanges();
    }
}
