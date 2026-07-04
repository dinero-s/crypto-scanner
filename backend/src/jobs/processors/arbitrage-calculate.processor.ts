import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    DEFAULT_QUEUE_WORKER_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { FundingArbitrageService } from 'src/modules/arbitrage/services/funding-arbitrage.service';
import { CashCarryArbitrageService } from 'src/modules/arbitrage/services/cash-carry-arbitrage.service';
import { ArbitrageCalculateJobData } from '../interfaces/scanner-job.interface';

/** Worker: пересчёт арбитражных возможностей */
@Processor(QUEUE_NAMES.SCANNER_ARBITRAGE, {
    concurrency: 1,
    lockDuration: DEFAULT_QUEUE_WORKER_LOCK_MS,
})
export class ArbitrageCalculateProcessor extends WorkerHost {
    private readonly logger = new Logger(ArbitrageCalculateProcessor.name);

    constructor(
        private readonly fundingArbitrageService: FundingArbitrageService,
        private readonly cashCarryArbitrageService: CashCarryArbitrageService,
    ) {
        super();
    }

    async process(job: Job<ArbitrageCalculateJobData, void, string>): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        if (job.name !== QUEUE_JOB_NAMES.SCANNER_ARBITRAGE_CALCULATE) {
            return;
        }

        await this.fundingArbitrageService.recalculate();
        await this.cashCarryArbitrageService.recalculate();
    }
}
