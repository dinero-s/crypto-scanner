import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import {
    AlertEvaluateJobData,
    ArbitrageCalculateJobData,
    CleanupSnapshotsJobData,
    CollectFundingRatesJobData,
    CollectInstrumentsJobData,
    CollectOpenInterestJobData,
    CollectPerpTickersJobData,
    CollectSpotTickersJobData,
    MarketDataCollectJobData,
    ScannerMarketDataJobData,
} from '../interfaces/scanner-job.interface';

/** Producer: постановка scanner jobs в очереди */
@Injectable()
export class ScannerQueueProducerService {
    constructor(
        @InjectQueue(QUEUE_NAMES.SCANNER_MARKET_DATA)
        private readonly marketDataQueue: Queue<ScannerMarketDataJobData>,
        @InjectQueue(QUEUE_NAMES.SCANNER_ARBITRAGE)
        private readonly arbitrageQueue: Queue<ArbitrageCalculateJobData>,
        @InjectQueue(QUEUE_NAMES.SCANNER_ALERTS)
        private readonly alertsQueue: Queue<AlertEvaluateJobData>,
    ) {}

    /** Поставить job сбора инструментов */
    async enqueueCollectInstruments(): Promise<void> {
        await this.enqueueMarketDataJob<CollectInstrumentsJobData>(
            QUEUE_JOB_NAMES.SCANNER_COLLECT_INSTRUMENTS,
            'instruments',
        );
    }

    /** Поставить job сбора spot-тикеров */
    async enqueueCollectSpotTickers(): Promise<void> {
        await this.enqueueMarketDataJob<CollectSpotTickersJobData>(
            QUEUE_JOB_NAMES.SCANNER_COLLECT_SPOT_TICKERS,
            'spot',
        );
    }

    /** Поставить job сбора perp-тикеров */
    async enqueueCollectPerpTickers(): Promise<void> {
        await this.enqueueMarketDataJob<CollectPerpTickersJobData>(
            QUEUE_JOB_NAMES.SCANNER_COLLECT_PERP_TICKERS,
            'perp',
        );
    }

    /** Поставить job сбора funding rates */
    async enqueueCollectFundingRates(): Promise<void> {
        await this.enqueueMarketDataJob<CollectFundingRatesJobData>(
            QUEUE_JOB_NAMES.SCANNER_COLLECT_FUNDING_RATES,
            'funding',
        );
    }

    /** Поставить job сбора open interest */
    async enqueueCollectOpenInterest(): Promise<void> {
        await this.enqueueMarketDataJob<CollectOpenInterestJobData>(
            QUEUE_JOB_NAMES.SCANNER_COLLECT_OPEN_INTEREST,
            'open-interest',
        );
    }

    /** Поставить job очистки старых снимков */
    async enqueueCleanupSnapshots(): Promise<void> {
        await this.enqueueMarketDataJob<CleanupSnapshotsJobData>(
            QUEUE_JOB_NAMES.SCANNER_CLEANUP_SNAPSHOTS,
            'cleanup',
        );
    }

    /** Поставить job сбора market data (legacy) */
    async enqueueMarketDataCollect(
        exchanges: ExchangeEnum[],
        symbols: string[],
    ): Promise<void> {
        const scheduledAt = Date.now();
        const jobId = `market-data:collect:${String(scheduledAt)}`;
        const payload: MarketDataCollectJobData = { exchanges, symbols, scheduledAt };

        await this.marketDataQueue.add(
            QUEUE_JOB_NAMES.SCANNER_MARKET_DATA_COLLECT,
            payload,
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );
    }

    /** Поставить job пересчёта арбитража */
    async enqueueArbitrageCalculate(): Promise<void> {
        const scheduledAt = Date.now();
        const jobId = `arbitrage:calculate:${String(scheduledAt)}`;

        await this.arbitrageQueue.add(
            QUEUE_JOB_NAMES.SCANNER_ARBITRAGE_CALCULATE,
            { scheduledAt },
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );
    }

    /** Поставить job проверки алертов */
    async enqueueAlertEvaluate(): Promise<void> {
        const scheduledAt = Date.now();
        const jobId = `alerts:evaluate:${String(scheduledAt)}`;

        await this.alertsQueue.add(
            QUEUE_JOB_NAMES.SCANNER_ALERT_EVALUATE,
            { scheduledAt },
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );
    }

    private async enqueueMarketDataJob<T extends { scheduledAt: number }>(
        jobName: string,
        idPrefix: string,
    ): Promise<void> {
        const scheduledAt = Date.now();
        const jobId = `market-data:${idPrefix}:${String(scheduledAt)}`;

        await this.marketDataQueue.add(
            jobName,
            { scheduledAt } as T,
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );
    }
}
