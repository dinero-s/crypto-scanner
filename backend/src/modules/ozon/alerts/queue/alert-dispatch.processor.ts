import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    OZON_ALERTS_QUEUE_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { AlertsService } from '../services/alerts.service';
import { AlertDispatchJobData } from './alert-queue.interface';

/** Worker асинхронной отправки алертов */
@Processor(QUEUE_NAMES.OZON_ALERTS, {
    concurrency: 2,
    lockDuration: OZON_ALERTS_QUEUE_LOCK_MS,
})
export class AlertDispatchProcessor extends WorkerHost {
    private readonly logger = new Logger(AlertDispatchProcessor.name);

    constructor(private readonly alertsService: AlertsService) {
        super();
    }

    async process(job: Job<AlertDispatchJobData, void, string>): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        if (job.name === QUEUE_JOB_NAMES.DISPATCH_ALERT) {
            await this.alertsService.dispatchAlertById(
                job.data.alertId,
                job.data.connectionId,
            );
        }
    }
}
