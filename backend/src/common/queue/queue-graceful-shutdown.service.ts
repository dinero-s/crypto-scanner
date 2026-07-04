import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './constants/queue.constant';

/** Graceful shutdown BullMQ queues при SIGTERM/SIGINT */
@Injectable()
export class QueueGracefulShutdownService implements OnApplicationShutdown {
    private readonly logger = new Logger(QueueGracefulShutdownService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.EXAMPLE)
        private readonly exampleQueue: Queue,
        @InjectQueue(QUEUE_NAMES.SCANNER_MARKET_DATA)
        private readonly marketDataQueue: Queue,
        @InjectQueue(QUEUE_NAMES.SCANNER_ARBITRAGE)
        private readonly arbitrageQueue: Queue,
        @InjectQueue(QUEUE_NAMES.SCANNER_ALERTS)
        private readonly alertsQueue: Queue,
    ) {}

    async onApplicationShutdown(signal?: string): Promise<void> {
        this.logger.log(`Closing BullMQ queues (signal=${signal ?? 'unknown'})`);
        await Promise.allSettled([
            this.exampleQueue.close(),
            this.marketDataQueue.close(),
            this.arbitrageQueue.close(),
            this.alertsQueue.close(),
        ]);
        this.logger.log('BullMQ queues closed');
    }
}
