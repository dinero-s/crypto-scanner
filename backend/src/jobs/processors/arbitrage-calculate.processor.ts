import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    DEFAULT_QUEUE_WORKER_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { ArbitrageRepository } from 'src/modules/arbitrage/repositories/arbitrage.repository';
import { CashCarryArbitrageService } from 'src/modules/arbitrage/services/cash-carry-arbitrage.service';
import { FundingArbitrageService } from 'src/modules/arbitrage/services/funding-arbitrage.service';
import { MarketDataCacheService } from 'src/modules/market-data/services/market-data-cache.service';
import { AlertQueueProducerService } from 'src/modules/alerts/services/alert-queue.producer.service';
import { ArbitrageCalculateJobData } from '../interfaces/scanner-job.interface';

/** Worker: пересчёт арбитражных возможностей */
@Processor(QUEUE_NAMES.SCANNER_ARBITRAGE, {
    concurrency: 1,
    lockDuration: DEFAULT_QUEUE_WORKER_LOCK_MS,
})
export class ArbitrageCalculateProcessor extends WorkerHost {
    constructor(
        private readonly fundingArbitrageService: FundingArbitrageService,
        private readonly cashCarryArbitrageService: CashCarryArbitrageService,
        private readonly arbitrageRepository: ArbitrageRepository,
        private readonly cacheService: MarketDataCacheService,
        private readonly alertQueueProducer: AlertQueueProducerService,
    ) {
        super();
    }

    async process(job: Job<ArbitrageCalculateJobData, void, string>): Promise<void> {
        if (job.name !== QUEUE_JOB_NAMES.SCANNER_ARBITRAGE_CALCULATE) {
            return;
        }

        await this.fundingArbitrageService.recalculate();
        await this.cashCarryArbitrageService.recalculate();

        const opportunities = await this.arbitrageRepository.findByQuery({ limit: 200 });
        await this.cacheService.setLatestOpportunities(opportunities);

        const scheduledAt = Date.now();
        await this.alertQueueProducer.enqueueEvaluate(scheduledAt);
    }
}
