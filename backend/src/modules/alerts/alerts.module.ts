import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { ArbitrageModule } from '../arbitrage/arbitrage.module';
import { TelegramUsersModule } from '../telegram-users/telegram-users.module';
import { AlertDeliveryEntity, AlertDeliverySchema } from './entities/alert-delivery.entity';
import { AlertSettingsEntity, AlertSettingsSchema } from './entities/alert-settings.entity';
import { AlertsRepository } from './repositories/alerts.repository';
import { AlertQueueProcessor } from './services/alert-queue.processor';
import { AlertQueueProducerService } from './services/alert-queue.producer.service';
import { AlertsService } from './services/alerts.service';
import { TelegramNotificationService } from './services/telegram-notification.service';

/** Модуль Telegram-алертов и порогов */
@Module({
    imports: [
        ConfigModule,
        HttpModule.register({ timeout: 15_000, maxRedirects: 3 }),
        BullModule.registerQueue({
            name: QUEUE_NAMES.SCANNER_ALERTS,
            defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
        }),
        MongooseModule.forFeature(
            [
                { name: AlertSettingsEntity.name, schema: AlertSettingsSchema },
                { name: AlertDeliveryEntity.name, schema: AlertDeliverySchema },
            ],
            DATABASE_CONNECTION_NAME,
        ),
        TelegramUsersModule,
        ArbitrageModule,
    ],
    controllers: [],
    providers: [
        AlertsRepository,
        AlertsService,
        TelegramNotificationService,
        AlertQueueProducerService,
        AlertQueueProcessor,
    ],
    exports: [AlertsService, AlertQueueProducerService, TelegramNotificationService],
})
export class AlertsModule {}
