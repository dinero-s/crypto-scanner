import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { AlertDispatchJobData } from './alert-queue.interface';

/** Producer очереди отправки алертов */
@Injectable()
export class AlertQueueProducerService {
    private readonly logger = new Logger(AlertQueueProducerService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.OZON_ALERTS)
        private readonly alertsQueue: Queue<AlertDispatchJobData>,
    ) {}

    async enqueueDispatch(alertId: string, connectionId?: string): Promise<void> {
        const jobId = `ozon:alert:${alertId}`;

        const existing = await this.alertsQueue.getJob(jobId);
        if (existing) {
            const state = await existing.getState();
            if (state === 'waiting' || state === 'active' || state === 'delayed') {
                this.logger.log(`jobId=${jobId} уже в очереди, пропуск`);
                return;
            }
        }

        await this.alertsQueue.add(
            QUEUE_JOB_NAMES.DISPATCH_ALERT,
            { alertId, connectionId },
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );

        this.logger.log(`jobId=${jobId} alert dispatch поставлен в очередь`);
    }
}
