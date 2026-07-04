import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CollectMarketDataDto } from '../dto/collect-market-data.dto';
import { MarketDataRepository } from '../repositories/market-data.repository';
import { FundingRateService } from './funding-rate.service';
import { FuturesPriceService } from './futures-price.service';
import { InstrumentCollectorService } from './instrument-collector.service';
import { OpenInterestService } from './open-interest.service';
import { SpotPriceService } from './spot-price.service';

interface CollectorRunState {
    lastRunAt: string;
    healthy: boolean;
}

export interface CollectorStatusResponse {
    lastRunAt: string | null;
    healthy: boolean;
    collectors: Record<string, CollectorRunState>;
}

/** Оркестратор сбора market data */
@Injectable()
export class MarketDataCollectorService {
    private readonly logger = new Logger(MarketDataCollectorService.name);

    private readonly runStates = new Map<string, CollectorRunState>();

    constructor(
        private readonly configService: ConfigService,
        private readonly marketDataRepository: MarketDataRepository,
        private readonly instrumentCollector: InstrumentCollectorService,
        private readonly spotPriceService: SpotPriceService,
        private readonly futuresPriceService: FuturesPriceService,
        private readonly fundingRateService: FundingRateService,
        private readonly openInterestService: OpenInterestService,
    ) {}

    /** Собрать инструменты */
    async collectInstruments(): Promise<void> {
        await this.runCollector('instruments', () => this.instrumentCollector.collectAll());
    }

    /** Собрать spot-тикеры */
    async collectSpotTickers(): Promise<void> {
        await this.runCollector('spot', () => this.spotPriceService.collectAll());
    }

    /** Собрать perp-тикеры */
    async collectPerpTickers(): Promise<void> {
        await this.runCollector('perp', () => this.futuresPriceService.collectAll());
    }

    /** Собрать funding rates */
    async collectFundingRates(): Promise<void> {
        await this.runCollector('funding', () => this.fundingRateService.collectAll());
    }

    /** Собрать open interest */
    async collectOpenInterest(): Promise<void> {
        await this.runCollector('openInterest', () => this.openInterestService.collectAll());
    }

    /** Очистить старые снимки */
    async cleanupOldSnapshots(): Promise<void> {
        const ttlDays = this.configService.get<number>('scanner.snapshotTtlDays') ?? 7;
        const cutoff = new Date(Date.now() - ttlDays * 86_400_000);

        const deleted = await this.marketDataRepository.deleteOlderThan(cutoff);
        this.logger.log(
            `cleanupOldSnapshots cutoff=${cutoff.toISOString()} deleted=${JSON.stringify(deleted)}`,
        );
    }

    /** Запустить полный цикл сбора (legacy) */
    async collectAll(dto: CollectMarketDataDto): Promise<void> {
        this.logger.log(
            `collectAll legacy: exchanges=${String(dto.exchanges.length)} symbols=${String(dto.symbols.length)}`,
        );
        await this.collectSpotTickers();
        await this.collectPerpTickers();
        await this.collectFundingRates();
    }

    /** Статус последнего сбора */
    async getCollectorStatus(): Promise<CollectorStatusResponse> {
        const collectors = Object.fromEntries(this.runStates.entries());
        const states = Array.from(this.runStates.values());
        const lastRunAt =
            states.length > 0
                ? states.reduce((latest, s) =>
                      s.lastRunAt > latest ? s.lastRunAt : latest,
                  states[0].lastRunAt)
                : null;
        const healthy = states.length === 0 || states.every((s) => s.healthy);

        return { lastRunAt, healthy, collectors };
    }

    private async runCollector(name: string, fn: () => Promise<number | void>): Promise<void> {
        try {
            await fn();
            this.runStates.set(name, {
                lastRunAt: new Date().toISOString(),
                healthy: true,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'unknown error';
            this.logger.error(`collector=${name} message=${message}`);
            this.runStates.set(name, {
                lastRunAt: new Date().toISOString(),
                healthy: false,
            });
        }
    }
}
