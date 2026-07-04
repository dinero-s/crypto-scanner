import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    OZON_SYNC_QUEUE_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { OzonQueueProducerService } from './ozon-queue.producer.service';
import {
    OzonAuditPipelineJobData,
    OzonSyncJobData,
} from './interfaces/ozon-queue.interface';
import { SellerDataSyncService } from '../seller/services/seller-data-sync.service';
import { getFirstAuditStep } from '../analytics/utils/audit-pipeline.utils';

/** Worker синхронизации Ozon (Seller API) */
@Processor(QUEUE_NAMES.OZON_SYNC, {
    concurrency: 2,
    lockDuration: OZON_SYNC_QUEUE_LOCK_MS,
})
export class OzonSyncProcessor extends WorkerHost {
    private readonly logger = new Logger(OzonSyncProcessor.name);

    constructor(
        private readonly sellerDataSyncService: SellerDataSyncService,
        private readonly queueProducer: OzonQueueProducerService,
    ) {
        super();
    }

    async process(
        job: Job<OzonSyncJobData | OzonAuditPipelineJobData, void, string>,
    ): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        if (job.name === QUEUE_JOB_NAMES.SYNC_OZON_FULL) {
            const data = job.data as OzonSyncJobData;
            await this.sellerDataSyncService.syncAll(data.connectionId, data.userId);
            return;
        }

        if (job.name === QUEUE_JOB_NAMES.OZON_INITIAL_SYNC) {
            const data = job.data as OzonAuditPipelineJobData;
            await this.sellerDataSyncService.syncAll(data.connectionId, data.userId);

            const pipelineData: OzonAuditPipelineJobData = {
                ...data,
                skipSync: true,
                reportType: 'INITIAL_AUDIT',
            };
            const firstStep = getFirstAuditStep(true);
            await this.queueProducer.enqueueAuditStep(pipelineData, firstStep);
        }
    }
}
