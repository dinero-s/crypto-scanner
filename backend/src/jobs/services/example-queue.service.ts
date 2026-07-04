import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { ExampleQueueJobData } from '../interfaces/example-queue-job.interface';

/** Producer: постановка job в очередь BullMQ */
@Injectable()
export class ExampleQueueService {
    private readonly logger = new Logger(ExampleQueueService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.EXAMPLE)
        private readonly exampleQueue: Queue<ExampleQueueJobData>,
    ) {}

    /** Добавляет job с idempotency key (jobId) */
    async enqueueExampleTask(
        idempotencyKey: string,
        data: ExampleQueueJobData,
    ): Promise<void> {
        await this.exampleQueue.add(QUEUE_JOB_NAMES.EXAMPLE_TASK, data, {
            ...DEFAULT_QUEUE_JOB_OPTIONS,
            jobId: idempotencyKey,
        });

        this.logger.log(
            `jobId=${idempotencyKey} поставлен в очередь ${QUEUE_NAMES.EXAMPLE}`,
        );
    }
}
