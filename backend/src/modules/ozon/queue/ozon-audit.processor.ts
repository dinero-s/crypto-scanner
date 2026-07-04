import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    OZON_AUDIT_QUEUE_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { OzonAuditService } from '../analytics/services/ozon-audit.service';
import { OzonAuditStepJobData } from './interfaces/ozon-queue.interface';

/** Worker шагов Profit Audit pipeline */
@Processor(QUEUE_NAMES.OZON_AUDIT, {
    concurrency: 1,
    lockDuration: OZON_AUDIT_QUEUE_LOCK_MS,
})
export class OzonAuditProcessor extends WorkerHost {
    private readonly logger = new Logger(OzonAuditProcessor.name);

    constructor(private readonly ozonAuditService: OzonAuditService) {
        super();
    }

    async process(job: Job<OzonAuditStepJobData, void, string>): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        if (job.name === QUEUE_JOB_NAMES.OZON_AUDIT_STEP) {
            try {
                await this.ozonAuditService.executeAuditStep(job.data);
            } catch (error) {
                this.logger.error(
                    `jobId=${String(job.id)} audit step failed auditRunId=${job.data.auditRunId} step=${job.data.step}`,
                );
                throw error;
            }
        }
    }
}
