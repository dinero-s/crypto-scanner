import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { ExampleQueueProcessor } from './processors/example-queue.processor';
import { ExampleQueueService } from './services/example-queue.service';

/** Пример очереди BullMQ для шаблона */
@Module({
    imports: [
        BullModule.registerQueue({
            name: QUEUE_NAMES.EXAMPLE,
            defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
        }),
    ],
    providers: [ExampleQueueProcessor, ExampleQueueService],
    exports: [ExampleQueueService],
})
export class JobsQueueModule {}
