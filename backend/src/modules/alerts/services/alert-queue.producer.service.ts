import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { AlertDispatchJobData } from '../interfaces/alert-dispatch-job.interface';

/** Producer: постановка алертов в очередь */
@Injectable()
export class AlertQueueProducerService {
    private readonly logger = new Logger(AlertQueueProducerService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.SCANNER_ALERTS)
        private readonly alertsQueue: Queue<AlertDispatchJobData>,
    ) {}

    /** Поставить job отправки алерта */
    async enqueueAlert(data: AlertDispatchJobData): Promise<void> {
        const jobId = `alert:${data.telegramUserId}:${data.alertType}:${String(data.calculatedAt)}`;

        await this.alertsQueue.add(QUEUE_JOB_NAMES.SCANNER_ALERT_DISPATCH, data, {
            ...DEFAULT_QUEUE_JOB_OPTIONS,
            jobId,
        });

        this.logger.log(`jobId=${jobId} поставлен в очередь`);
    }
}
