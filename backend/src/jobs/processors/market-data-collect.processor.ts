import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    DEFAULT_QUEUE_WORKER_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { MarketDataCollectorService } from 'src/modules/market-data/services/market-data-collector.service';
import { MarketDataCollectJobData } from '../interfaces/scanner-job.interface';

/** Worker: сбор market data */
@Processor(QUEUE_NAMES.SCANNER_MARKET_DATA, {
    concurrency: 1,
    lockDuration: DEFAULT_QUEUE_WORKER_LOCK_MS,
})
export class MarketDataCollectProcessor extends WorkerHost {
    private readonly logger = new Logger(MarketDataCollectProcessor.name);

    constructor(private readonly marketDataCollector: MarketDataCollectorService) {
        super();
    }

    async process(job: Job<MarketDataCollectJobData, void, string>): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        if (job.name !== QUEUE_JOB_NAMES.SCANNER_MARKET_DATA_COLLECT) {
            return;
        }

        await this.marketDataCollector.collectAll({
            exchanges: job.data.exchanges,
            symbols: job.data.symbols,
            force: job.data.force,
        });
    }
}
