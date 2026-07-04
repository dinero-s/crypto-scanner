import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ScannerQueueProducerService } from './scanner-queue.producer.service';

/** Cron: периодический запуск scanner pipeline */
@Injectable()
export class ScannerScheduledTasksService {
    private readonly logger = new Logger(ScannerScheduledTasksService.name);

    constructor(
        private readonly scannerQueueProducer: ScannerQueueProducerService,
        private readonly configService: ConfigService,
    ) {}

    /** Сбор market data каждые 5 минут */
    @Cron('0 */5 * * * *')
    async scheduleMarketDataCollect(): Promise<void> {
        const enabled = this.configService.get<boolean>('scanner.jobsEnabled') ?? true;
        if (!enabled) {
            return;
        }

        this.logger.log('scheduleMarketDataCollect');
        const symbols = this.configService.get<string[]>('scanner.defaultSymbols') ?? [
            'BTC/USDT',
            'ETH/USDT',
        ];
        const exchanges = Object.values(ExchangeEnum);

        await this.scannerQueueProducer.enqueueMarketDataCollect(exchanges, symbols);
    }

    /** Пересчёт арбитража каждые 5 минут (+30 сек после сбора) */
    @Cron('30 */5 * * * *')
    async scheduleArbitrageCalculate(): Promise<void> {
        const enabled = this.configService.get<boolean>('scanner.jobsEnabled') ?? true;
        if (!enabled) {
            return;
        }

        this.logger.log('scheduleArbitrageCalculate');
        await this.scannerQueueProducer.enqueueArbitrageCalculate();
    }

    /** Проверка алертов каждые 5 минут (+60 сек) */
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
