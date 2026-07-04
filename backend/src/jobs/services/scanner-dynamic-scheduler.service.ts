import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScannerQueueProducerService } from './scanner-queue.producer.service';

interface IntervalConfig {
    name: string;
    intervalSec: number;
    handler: () => Promise<void>;
}

/** Динамический планировщик scanner jobs из конфига */
@Injectable()
export class ScannerDynamicSchedulerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ScannerDynamicSchedulerService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly scannerQueueProducer: ScannerQueueProducerService,
    ) {}

    onModuleInit(): void {
        const enabled = this.configService.get<boolean>('scanner.jobsEnabled') ?? true;
        if (!enabled) {
            this.logger.log('scanner jobs disabled');
            return;
        }

        const intervals = this.configService.get<Record<string, number>>('scanner.intervals');
        if (!intervals) {
            return;
        }

        const jobs: IntervalConfig[] = [
            {
                name: 'collectInstruments',
                intervalSec: intervals.instrumentsSec,
                handler: () => this.scannerQueueProducer.enqueueCollectInstruments(),
            },
            {
                name: 'collectSpotTickers',
                intervalSec: intervals.spotTickersSec,
                handler: () => this.scannerQueueProducer.enqueueCollectSpotTickers(),
            },
            {
                name: 'collectPerpTickers',
                intervalSec: intervals.perpTickersSec,
                handler: () => this.scannerQueueProducer.enqueueCollectPerpTickers(),
            },
            {
                name: 'collectFundingRates',
                intervalSec: intervals.fundingRatesSec,
                handler: () => this.scannerQueueProducer.enqueueCollectFundingRates(),
            },
            {
                name: 'collectOpenInterest',
                intervalSec: intervals.openInterestSec,
                handler: () => this.scannerQueueProducer.enqueueCollectOpenInterest(),
            },
            {
                name: 'calculateArbitrage',
                intervalSec: intervals.arbitrageSec,
                handler: () => this.scannerQueueProducer.enqueueArbitrageCalculate(),
            },
        ];

        for (const job of jobs) {
            this.registerInterval(job);
        }

        this.registerDailyCleanup();
        this.logger.log('scanner dynamic scheduler initialized');
    }

    onModuleDestroy(): void {
        const intervals = this.schedulerRegistry.getIntervals();
        for (const name of intervals) {
            this.schedulerRegistry.deleteInterval(name);
        }

        const crons = this.schedulerRegistry.getCronJobs();
        for (const name of crons.keys()) {
            crons.get(name)?.stop();
            this.schedulerRegistry.deleteCronJob(name);
        }
    }

    private registerInterval(config: IntervalConfig): void {
        const ms = config.intervalSec * 1000;
        const callback = (): void => {
            void config.handler().catch((error: unknown) => {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`scheduler=${config.name} message=${message}`);
            });
        };

        const interval = setInterval(callback, ms);
        this.schedulerRegistry.addInterval(config.name, interval);
        this.logger.log(`interval registered name=${config.name} ms=${String(ms)}`);
    }

    private registerDailyCleanup(): void {
        const job = new CronJob('0 0 * * *', () => {
            void this.scannerQueueProducer.enqueueCleanupSnapshots().catch((error: unknown) => {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`scheduler=cleanupOldSnapshots message=${message}`);
            });
        });

        this.schedulerRegistry.addCronJob('cleanupOldSnapshots', job);
        job.start();
        this.logger.log('cron registered name=cleanupOldSnapshots schedule=0 0 * * *');
    }
}
