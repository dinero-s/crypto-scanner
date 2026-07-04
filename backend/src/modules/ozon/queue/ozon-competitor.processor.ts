import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    OZON_COMPETITOR_QUEUE_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { CompetitorTrackingService } from '../competitor/services/competitor-tracking.service';
import {
    OzonCompetitorSyncJobData,
    OzonCompetitorsBulkSyncJobData,
} from './interfaces/ozon-queue.interface';

/** Worker синхронизации конкурентов Ozon */
@Processor(QUEUE_NAMES.OZON_COMPETITOR, {
    concurrency: 2,
    lockDuration: OZON_COMPETITOR_QUEUE_LOCK_MS,
})
export class OzonCompetitorProcessor extends WorkerHost {
    private readonly logger = new Logger(OzonCompetitorProcessor.name);

    constructor(
        private readonly competitorTrackingService: CompetitorTrackingService,
    ) {
        super();
    }

    async process(
        job: Job<
            OzonCompetitorSyncJobData | OzonCompetitorsBulkSyncJobData,
            void,
            string
        >,
    ): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        if (job.name === QUEUE_JOB_NAMES.SYNC_COMPETITOR_OFFICIAL_STATS) {
            const data = job.data as OzonCompetitorSyncJobData;
            await this.competitorTrackingService.syncCompetitor(
                data.competitorId,
                data.userId,
            );
            return;
        }

        if (job.name === QUEUE_JOB_NAMES.OZON_COMPETITORS_SYNC) {
            const data = job.data as OzonCompetitorsBulkSyncJobData;
            await this.competitorTrackingService.fanOutCompetitorSyncJobs(
                data.userId,
                data.connectionId,
            );
        }
    }
}
