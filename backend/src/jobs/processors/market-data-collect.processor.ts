import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    DEFAULT_QUEUE_WORKER_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { MarketDataCollectorService } from 'src/modules/market-data/services/market-data-collector.service';
import {
    MarketDataCollectJobData,
    ScannerMarketDataJobData,
} from '../interfaces/scanner-job.interface';

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

    async process(job: Job<ScannerMarketDataJobData, void, string>): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        switch (job.name) {
            case QUEUE_JOB_NAMES.SCANNER_COLLECT_INSTRUMENTS:
                await this.marketDataCollector.collectInstruments();
                return;
            case QUEUE_JOB_NAMES.SCANNER_COLLECT_SPOT_TICKERS:
                await this.marketDataCollector.collectSpotTickers();
                return;
            case QUEUE_JOB_NAMES.SCANNER_COLLECT_PERP_TICKERS:
                await this.marketDataCollector.collectPerpTickers();
                return;
            case QUEUE_JOB_NAMES.SCANNER_COLLECT_FUNDING_RATES:
                await this.marketDataCollector.collectFundingRates();
                return;
            case QUEUE_JOB_NAMES.SCANNER_COLLECT_OPEN_INTEREST:
                await this.marketDataCollector.collectOpenInterest();
                return;
            case QUEUE_JOB_NAMES.SCANNER_CLEANUP_SNAPSHOTS:
                await this.marketDataCollector.cleanupOldSnapshots();
                return;
            case QUEUE_JOB_NAMES.SCANNER_MARKET_DATA_COLLECT: {
                const legacy = job.data as MarketDataCollectJobData;
                await this.marketDataCollector.collectAll({
                    exchanges: legacy.exchanges,
                    symbols: legacy.symbols,
                    force: legacy.force,
                });
                return;
            }
            default:
                this.logger.warn(`unknown job name=${job.name}`);
        }
    }
}
