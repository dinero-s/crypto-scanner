import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { ExampleQueueProcessor } from './processors/example-queue.processor';
import { ExampleQueueService } from './services/example-queue.service';
import { MarketDataCollectProcessor } from './processors/market-data-collect.processor';
import { ArbitrageCalculateProcessor } from './processors/arbitrage-calculate.processor';
import { ScannerQueueProducerService } from './services/scanner-queue.producer.service';
import { MarketDataModule } from 'src/modules/market-data/market-data.module';
import { ArbitrageModule } from 'src/modules/arbitrage/arbitrage.module';
import { AlertsModule } from 'src/modules/alerts/alerts.module';

/** BullMQ очереди: example + scanner pipeline */
@Module({
    imports: [
        MarketDataModule,
        ArbitrageModule,
        AlertsModule,
        BullModule.registerQueue(
            {
                name: QUEUE_NAMES.EXAMPLE,
                defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
            },
            {
                name: QUEUE_NAMES.SCANNER_MARKET_DATA,
                defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
            },
            {
                name: QUEUE_NAMES.SCANNER_ARBITRAGE,
                defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
            },
        ),
    ],
    providers: [
        ExampleQueueProcessor,
        ExampleQueueService,
        MarketDataCollectProcessor,
        ArbitrageCalculateProcessor,
        ScannerQueueProducerService,
    ],
    exports: [ExampleQueueService, ScannerQueueProducerService],
})
export class JobsQueueModule {}
