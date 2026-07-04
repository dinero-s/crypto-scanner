import { Injectable, Logger } from '@nestjs/common';
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
    MarketDataCollectJobData,
} from '../interfaces/scanner-job.interface';

/** Producer: постановка scanner jobs в очереди */
@Injectable()
export class ScannerQueueProducerService {
    private readonly logger = new Logger(ScannerQueueProducerService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.SCANNER_MARKET_DATA)
        private readonly marketDataQueue: Queue<MarketDataCollectJobData>,
        @InjectQueue(QUEUE_NAMES.SCANNER_ARBITRAGE)
        private readonly arbitrageQueue: Queue<ArbitrageCalculateJobData>,
        @InjectQueue(QUEUE_NAMES.SCANNER_ALERTS)
        private readonly alertsQueue: Queue<AlertEvaluateJobData>,
    ) {}

    /** Поставить job сбора market data */
    async enqueueMarketDataCollect(
        exchanges: ExchangeEnum[],
        symbols: string[],
    ): Promise<void> {
        const scheduledAt = Date.now();
        const jobId = `market-data:collect:${String(scheduledAt)}`;

        await this.marketDataQueue.add(
            QUEUE_JOB_NAMES.SCANNER_MARKET_DATA_COLLECT,
            { exchanges, symbols, scheduledAt },
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );

        this.logger.log(`jobId=${jobId} поставлен в очередь`);
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

        this.logger.log(`jobId=${jobId} поставлен в очередь`);
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

        this.logger.log(`jobId=${jobId} поставлен в очередь`);
    }
}
