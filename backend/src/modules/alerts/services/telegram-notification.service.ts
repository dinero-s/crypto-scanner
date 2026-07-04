import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Types } from 'mongoose';
import { AlertsRepository } from '../repositories/alerts.repository';
import { AlertDeliveryStatusEnum } from '../enums/alert-type.enum';

interface TelegramInlineKeyboard {
    inline_keyboard: Array<Array<{ text: string; web_app?: { url: string }; url?: string }>>;
}

/** Отправка Telegram-уведомлений через Bot API */
@Injectable()
export class TelegramNotificationService {
    private readonly logger = new Logger(TelegramNotificationService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly alertsRepository: AlertsRepository,
    ) {}

    /** Отправить текстовое сообщение */
    async sendMessage(
        telegramChatId: string,
        message: string,
        deliveryId?: Types.ObjectId,
        withMiniAppButton = true,
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

        const replyMarkup = withMiniAppButton ? this.buildMiniAppKeyboard() : undefined;

        try {
            await this.callBotApi(token, 'sendMessage', {
                chat_id: telegramChatId,
                text: message,
                disable_web_page_preview: true,
                reply_markup: replyMarkup,
            });

            if (deliveryId) {
                await this.alertsRepository.updateDeliveryStatus(
                    deliveryId,
                    AlertDeliveryStatusEnum.SENT,
                );
            }

            this.logger.log(`sendMessage chatId=${telegramChatId} ok=true`);
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`sendMessage chatId=${telegramChatId} error=${errorMessage}`);

            if (deliveryId) {
                await this.alertsRepository.updateDeliveryStatus(
                    deliveryId,
                    AlertDeliveryStatusEnum.FAILED,
                    errorMessage,
                );
            }
            return false;
        }
    }

    /** Raw Bot API call */
    async callBotApi<T>(
        token: string,
        method: string,
        payload: Record<string, unknown>,
    ): Promise<T> {
        const url = `https://api.telegram.org/bot${token}/${method}`;
        const response = await firstValueFrom(
            this.httpService.post<{ ok: boolean; description?: string; result?: T }>(url, payload),
        );

        if (!response.data.ok) {
            throw new Error(response.data.description ?? `Telegram API error: ${method}`);
        }

        return response.data.result as T;
    }

    /** Кнопка Mini App */
    buildMiniAppKeyboard(): TelegramInlineKeyboard | undefined {
        const miniAppUrl = this.configService.get<string>('telegram.miniAppUrl');
        if (!miniAppUrl) {
            return undefined;
        }

        return {
            inline_keyboard: [
                [
                    {
                        text: 'Открыть Mini App',
                        web_app: { url: miniAppUrl },
                    },
                ],
            ],
        };
    }
}
