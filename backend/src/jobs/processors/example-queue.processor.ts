import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    DEFAULT_QUEUE_WORKER_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { ExampleQueueJobData } from '../interfaces/example-queue-job.interface';

/** Пример worker BullMQ для шаблона */
@Processor(QUEUE_NAMES.EXAMPLE, {
    concurrency: 1,
    lockDuration: DEFAULT_QUEUE_WORKER_LOCK_MS,
})
export class ExampleQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(ExampleQueueProcessor.name);

    async process(job: Job<ExampleQueueJobData, void, string>): Promise<void> {
        if (job.name !== QUEUE_JOB_NAMES.EXAMPLE_TASK) {
            this.logger.warn(`jobId=${String(job.id)} неизвестный job: ${job.name}`);
            return;
        }

        this.logger.log(
            `jobId=${String(job.id)} name=${job.name} message=${job.data.message}`,
        );
    }
}
