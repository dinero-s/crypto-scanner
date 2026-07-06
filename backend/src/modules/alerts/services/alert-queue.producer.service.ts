import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { AlertEvaluateJobData } from 'src/jobs/interfaces/scanner-job.interface';
import { AlertDispatchJobData } from '../interfaces/alert-dispatch-job.interface';

/** Producer: постановка алертов в очередь */
@Injectable()
export class AlertQueueProducerService {
    constructor(
        @InjectQueue(QUEUE_NAMES.SCANNER_ALERTS)
        private readonly alertsQueue: Queue<AlertDispatchJobData | AlertEvaluateJobData>,
    ) {}

    /** Поставить job отправки алерта */
    async enqueueAlert(data: AlertDispatchJobData): Promise<void> {
        const jobId = `alert:${data.telegramUserId}:${data.fingerprint}`;

        await this.alertsQueue.add(QUEUE_JOB_NAMES.SCANNER_ALERT_DISPATCH, data, {
            ...DEFAULT_QUEUE_JOB_OPTIONS,
            jobId,
        });
    }

    /** Поставить job проверки порогов */
    async enqueueEvaluate(scheduledAt: number): Promise<void> {
        const jobId = `alert-evaluate:${String(scheduledAt)}`;

        await this.alertsQueue.add(
            QUEUE_JOB_NAMES.SCANNER_ALERT_EVALUATE,
            { scheduledAt } satisfies AlertEvaluateJobData,
            {
                ...DEFAULT_QUEUE_JOB_OPTIONS,
                jobId,
            },
        );
    }
}
