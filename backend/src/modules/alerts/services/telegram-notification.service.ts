import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { AlertsRepository } from '../repositories/alerts.repository';
import { AlertDeliveryStatusEnum } from '../enums/alert-type.enum';

/** Отправка Telegram-уведомлений (Bot API) */
@Injectable()
export class TelegramNotificationService {
    private readonly logger = new Logger(TelegramNotificationService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly alertsRepository: AlertsRepository,
    ) {}

    /** Отправить сообщение пользователю */
    async sendMessage(
        telegramChatId: string,
        message: string,
        deliveryId?: Types.ObjectId,
    ): Promise<boolean> {
        const token = this.configService.get<string>('telegram.botToken');
        if (!token) {
            this.logger.warn('TELEGRAM_BOT_TOKEN не задан — отправка пропущена');
            if (deliveryId) {
                await this.alertsRepository.updateDeliveryStatus(
                    deliveryId,
                    AlertDeliveryStatusEnum.FAILED,
                    'Bot token not configured',
                );
            }
            return false;
        }

        this.logger.log(
            `sendMessage chatId=${telegramChatId} len=${String(message.length)} — заглушка`,
        );

        if (deliveryId) {
            await this.alertsRepository.updateDeliveryStatus(
                deliveryId,
                AlertDeliveryStatusEnum.SENT,
            );
        }
        return true;
    }
}
