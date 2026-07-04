import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    DEFAULT_QUEUE_WORKER_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { AlertDispatchJobData } from '../interfaces/alert-dispatch-job.interface';
import { AlertEvaluateJobData } from 'src/jobs/interfaces/scanner-job.interface';
import { AlertsService } from './alerts.service';
import { TelegramNotificationService } from './telegram-notification.service';

/** Worker: отправка Telegram-алертов и проверка порогов */
@Processor(QUEUE_NAMES.SCANNER_ALERTS, {
    concurrency: 2,
    lockDuration: DEFAULT_QUEUE_WORKER_LOCK_MS,
})
export class AlertQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(AlertQueueProcessor.name);

    constructor(
        private readonly telegramNotificationService: TelegramNotificationService,
        private readonly alertsService: AlertsService,
    ) {
        super();
    }

    async process(
        job: Job<AlertDispatchJobData | AlertEvaluateJobData, void, string>,
    ): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        if (job.name === QUEUE_JOB_NAMES.SCANNER_ALERT_DISPATCH) {
            const data = job.data as AlertDispatchJobData;
            await this.telegramNotificationService.sendMessage(
                data.telegramChatId,
                data.message,
            );
            return;
        }

        if (job.name === QUEUE_JOB_NAMES.SCANNER_ALERT_EVALUATE) {
            await this.alertsService.evaluateAndDispatch();
            return;
        }

        this.logger.warn(`jobId=${String(job.id)} неизвестный job: ${job.name}`);
    }
}
