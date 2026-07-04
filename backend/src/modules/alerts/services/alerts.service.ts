import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { CreateAlertSettingsDto, UpdateAlertSettingsDto } from '../dto/alert-settings.dto';
import { AlertsRepository } from '../repositories/alerts.repository';
import { AlertQueueProducerService } from './alert-queue.producer.service';

/** Бизнес-логика алертов */
@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);

    constructor(
        private readonly alertsRepository: AlertsRepository,
        private readonly alertQueueProducer: AlertQueueProducerService,
        private readonly configService: ConfigService,
    ) {}

    /** Получить настройки пользователя */
    async getSettings(userId: Types.ObjectId) {
        return this.alertsRepository.findSettingsByUserId(userId);
    }

    /** Создать настройки */
    async createSettings(userId: Types.ObjectId, dto: CreateAlertSettingsDto) {
        return this.alertsRepository.createSettings(userId, dto);
    }

    /** Обновить настройки */
    async updateSettings(userId: Types.ObjectId, dto: UpdateAlertSettingsDto) {
        return this.alertsRepository.updateSettings(userId, dto);
    }

    /** Проверить пороги и поставить уведомления в очередь */
    async evaluateAndDispatch(): Promise<void> {
        this.logger.log('evaluateAndDispatch — заглушка');
        const enabled = this.configService.get<boolean>('telegram.alertsEnabled') ?? true;
        if (!enabled) {
            this.logger.log('Telegram alerts отключены в конфиге');
            return;
        }
    }
}
