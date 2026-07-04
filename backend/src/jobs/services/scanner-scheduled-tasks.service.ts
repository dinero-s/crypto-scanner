import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ScannerQueueProducerService } from './scanner-queue.producer.service';

/** Cron: проверка алертов (не зависит от market data интервалов) */
@Injectable()
export class ScannerScheduledTasksService {
    private readonly logger = new Logger(ScannerScheduledTasksService.name);

    constructor(
        private readonly scannerQueueProducer: ScannerQueueProducerService,
        private readonly configService: ConfigService,
    ) {}

    /** Проверка алертов каждые 5 минут */
    @Cron('0 1-59/5 * * * *')
    async scheduleAlertEvaluate(): Promise<void> {
        const enabled = this.configService.get<boolean>('scanner.jobsEnabled') ?? true;
        if (!enabled) {
            return;
        }

        this.logger.log('scheduleAlertEvaluate');
        await this.scannerQueueProducer.enqueueAlertEvaluate();
    }
}
