import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
    TelegramUpdatePayload,
    TelegramUpdatesResponse,
} from '../interfaces/telegram-update.interface';
import { TelegramBotService } from './telegram-bot.service';

/** Long polling Telegram Bot API (dev/local) */
@Injectable()
export class TelegramBotPollingService implements OnApplicationBootstrap {
    private readonly logger = new Logger(TelegramBotPollingService.name);
    private offset = 0;
    private polling = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly telegramBotService: TelegramBotService,
    ) {}

    onApplicationBootstrap(): void {
        const usePolling = this.configService.get<boolean>('telegram.usePolling') ?? false;
        if (!usePolling) {
            return;
        }

        const token = this.configService.get<string>('telegram.botToken');
        if (!token) {
            this.logger.warn('TELEGRAM_USE_POLLING=true, но TELEGRAM_BOT_TOKEN не задан');
            return;
        }

        this.logger.log('Запуск Telegram long polling');
        void this.runPollingLoop(token);
    }

    private async runPollingLoop(token: string): Promise<void> {
        if (this.polling) {
            return;
        }
        this.polling = true;

        while (this.polling) {
            try {
                const updates = await this.fetchUpdates(token);
                for (const update of updates) {
                    await this.telegramBotService.handleUpdate(update);
                    this.offset = update.update_id + 1;
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`polling error=${message}`);
                await this.sleep(3000);
            }
        }
    }

    private async fetchUpdates(token: string): Promise<TelegramUpdatePayload[]> {
        const url = `https://api.telegram.org/bot${token}/getUpdates`;
        const response = await firstValueFrom(
            this.httpService.post<TelegramUpdatesResponse>(url, {
                offset: this.offset,
                timeout: 25,
                allowed_updates: ['message'],
            }),
        );

        if (!response.data.ok) {
            return [];
        }

        return response.data.result;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
