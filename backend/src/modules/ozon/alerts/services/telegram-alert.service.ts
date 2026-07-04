import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/** Отправка алертов через официальный Telegram Bot API */
@Injectable()
export class TelegramAlertService {
    private readonly logger = new Logger(TelegramAlertService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async sendMessage(chatId: string, text: string): Promise<void> {
        const token = this.configService.get<string>('ozon.alerts.telegramBotToken');
        if (!token) {
            throw new Error('OZON_TELEGRAM_BOT_TOKEN не задан');
        }

        const url = `https://api.telegram.org/bot${token}/sendMessage`;

        await firstValueFrom(
            this.httpService.post<{ ok: boolean }>(url, {
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        );

        this.logger.log(`telegram message sent chatId=${chatId.slice(0, 4)}****`);
    }
}
