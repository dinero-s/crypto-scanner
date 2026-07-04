import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { AlertsService } from 'src/modules/alerts/services/alerts.service';
import { AlertSettingsResponseDto } from 'src/modules/alerts/dto/alert-settings.dto';
import {
    estimateProfitUsd1000,
    formatExchangeLabel,
    formatRiskLevel,
    formatTimeToFunding,
} from 'src/modules/alerts/utils/alert-message.util';
import { ArbitrageService } from 'src/modules/arbitrage/services/arbitrage.service';
import { TelegramNotificationService } from 'src/modules/alerts/services/telegram-notification.service';
import { SubscriptionStatusEnum } from 'src/modules/telegram-users/enums/subscription-status.enum';
import { TelegramUsersRepository } from 'src/modules/telegram-users/repositories/telegram-users.repository';
import { TelegramUpdatePayload } from '../interfaces/telegram-update.interface';

/** Обработка команд Telegram-бота */
@Injectable()
export class TelegramBotService {
    private readonly logger = new Logger(TelegramBotService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly telegramUsersRepository: TelegramUsersRepository,
        private readonly alertsService: AlertsService,
        private readonly arbitrageService: ArbitrageService,
        private readonly telegramNotificationService: TelegramNotificationService,
    ) {}

    /** Обработать входящий update */
    async handleUpdate(update: TelegramUpdatePayload): Promise<void> {
        const message = update.message;
        if (!message?.text || !message.from) {
            return;
        }

        if (message.from.is_bot) {
            return;
        }

        const telegramId = String(message.from.id);
        const chatId = String(message.chat.id);

        const user = await this.telegramUsersRepository.upsertFromTelegram({
            telegramId,
            chatId,
            username: message.from.username,
            firstName: message.from.first_name,
            lastName: message.from.last_name,
            languageCode: message.from.language_code ?? 'ru',
        });

        const command = this.extractCommand(message.text);
        if (!command) {
            return;
        }

        this.logger.log(`command=${command} telegramId=${telegramId}`);

        switch (command) {
            case '/start':
                await this.alertsService.ensureDefaultSettings(user._id);
                await this.sendStartMessage(chatId);
                break;
            case '/settings':
                await this.sendSettingsMessage(chatId, user._id);
                break;
            case '/status':
                await this.sendStatusMessage(chatId, user._id, user.subscriptionStatus);
                break;
            case '/top':
                await this.sendTopMessage(chatId);
                break;
            default:
                await this.telegramNotificationService.sendMessage(
                    chatId,
                    'Неизвестная команда. Доступны: /start, /settings, /status, /top',
                    undefined,
                    true,
                );
        }
    }

    private extractCommand(text: string): string | null {
        const trimmed = text.trim();
        if (!trimmed.startsWith('/')) {
            return null;
        }
        const firstToken = trimmed.split(/\s+/)[0] ?? '';
        return firstToken.split('@')[0]?.toLowerCase() ?? null;
    }

    private async sendStartMessage(chatId: string): Promise<void> {
        const text = `👋 Добро пожаловать в Crypto Scanner Bot!

⚠️ <b>Дисклеймер о рисках</b>
Данные носят информационный характер. Криптовалютный арбитраж связан с рисками: проскальзывание, комиссии, ликвидность, задержки исполнения.
Показатели доходности являются <b>оценочными</b> и не гарантируют прибыль.
Используя бота, вы принимаете эти риски на себя.

Команды:
/settings — пороги алертов
/status — статус подписки и алертов
/top — топ возможностей

Нажмите кнопку ниже, чтобы открыть Mini App.`;

        await this.sendHtmlMessage(chatId, text);
    }

    private async sendSettingsMessage(chatId: string, userId: Types.ObjectId): Promise<void> {
        const settings = await this.alertsService.getSettings(userId);
        const text = this.formatSettingsText(settings);
        await this.sendHtmlMessage(chatId, text);
    }

    private async sendStatusMessage(
        chatId: string,
        userId: Types.ObjectId,
        subscriptionStatus: SubscriptionStatusEnum,
    ): Promise<void> {
        const settings = await this.alertsService.getSettings(userId);
        const sentToday = await this.alertsService.countSentToday(userId);
        const subscriptionLabel = this.formatSubscriptionLabel(subscriptionStatus);

        const text = `📊 <b>Статус</b>

Подписка: ${subscriptionLabel}
Алерты: ${settings.enabled ? 'включены ✅' : 'выключены ❌'}
Отправлено сегодня: ${String(sentToday)}

Free-план: алерты только по топ-${String(3)} возможностям.
Premium: без ограничений (флаг в БД).`;

        await this.sendHtmlMessage(chatId, text);
    }

    private async sendTopMessage(chatId: string): Promise<void> {
        const rows = await this.arbitrageService.findTop({ limit: 3 });
        if (rows.length === 0) {
            await this.telegramNotificationService.sendMessage(
                chatId,
                'Сейчас нет активных возможностей. Попробуйте позже.',
                undefined,
                true,
            );
            return;
        }

        const lines = rows.map((row, index) => {
            const asset = `${row.baseAsset}/${row.quoteAsset}`;
            const spot = formatExchangeLabel(row.spotExchange);
            const perp = formatExchangeLabel(row.futuresExchange);
            const netYield = row.netYieldPercent.toFixed(3);
            const profit = estimateProfitUsd1000(row.netYieldPercent);
            const typeLabel = row.type === 'cash_carry' ? 'Cash&Carry' : 'Funding';

            return `${String(index + 1)}. ${asset} (${typeLabel})
Spot: ${spot} | Perp: ${perp}
Net Yield: ${netYield}% | ~$${profit} на $1000
Risk: ${formatRiskLevel(row.riskScore)} | Funding: ${formatTimeToFunding(row.nextFundingTime)}`;
        });

        const text = `🏆 <b>Топ-${String(rows.length)} возможностей</b>

${lines.join('\n\n')}

Оценочная доходность, не финансовая рекомендация.`;

        await this.sendHtmlMessage(chatId, text);
    }

    private formatSettingsText(settings: AlertSettingsResponseDto): string {
        const exchanges =
            settings.allowedExchanges.length > 0
                ? settings.allowedExchanges.join(', ')
                : 'все';
        const symbols =
            settings.symbolsWhitelist.length > 0
                ? settings.symbolsWhitelist.join(', ')
                : 'все';

        return `⚙️ <b>Настройки алертов</b>

Статус: ${settings.enabled ? 'включены ✅' : 'выключены ❌'}
Мин. funding rate: ${(settings.minFundingRate * 100).toFixed(3)}%
Мин. net yield: ${settings.minNetYield.toFixed(3)}%
Мин. basis: ${settings.minBasis.toFixed(3)}%
Биржи: ${exchanges}
Символы: ${symbols}
Cooldown: ${String(settings.alertCooldownSec)} сек

Изменить пороги можно в Mini App → Настройки.`;
    }

    private formatSubscriptionLabel(status: SubscriptionStatusEnum): string {
        if (status === SubscriptionStatusEnum.PREMIUM) {
            return 'Premium ⭐';
        }
        if (status === SubscriptionStatusEnum.TRIAL) {
            return 'Trial';
        }
        return 'Free (топ-3 алерта)';
    }

    private async sendHtmlMessage(chatId: string, text: string): Promise<void> {
        const token = this.configService.get<string>('telegram.botToken');
        if (!token) {
            this.logger.warn('TELEGRAM_BOT_TOKEN не задан');
            return;
        }

        await this.telegramNotificationService.callBotApi(token, 'sendMessage', {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: this.telegramNotificationService.buildMiniAppKeyboard(),
        });
    }
}
