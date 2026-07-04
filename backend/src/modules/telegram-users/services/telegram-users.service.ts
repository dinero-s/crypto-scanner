import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramAuthDto, UpdateTelegramUserDto } from '../dto/telegram-user.dto';
import { TelegramUsersRepository } from '../repositories/telegram-users.repository';
import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';

/** Бизнес-логика Telegram-пользователей */
@Injectable()
export class TelegramUsersService {
    private readonly logger = new Logger(TelegramUsersService.name);

    constructor(
        private readonly telegramUsersRepository: TelegramUsersRepository,
        private readonly configService: ConfigService,
    ) {}

    /** Авторизация через initData (заглушка — валидация на этапе 2) */
    async authenticate(dto: TelegramAuthDto) {
        this.logger.log('authenticate via initData — заглушка');
        const botToken = this.configService.get<string>('telegram.botToken');
        if (!botToken) {
            this.logger.warn('TELEGRAM_BOT_TOKEN не задан');
        }
        return { authenticated: false, message: 'Not implemented' };
    }

    /** Получить или создать пользователя */
    async upsertUser(data: {
        telegramId: string;
        chatId: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        languageCode?: string;
    }) {
        return this.telegramUsersRepository.upsertFromTelegram(data);
    }

    /** Профиль пользователя */
    async getProfile(telegramId: string) {
        const user = await this.telegramUsersRepository.findByTelegramId(telegramId);
        if (!user) {
            return null;
        }
        return {
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            subscriptionStatus: user.subscriptionStatus,
            languageCode: user.languageCode,
        };
    }

    /** Обновить профиль */
    async updateProfile(telegramId: string, dto: UpdateTelegramUserDto) {
        return this.telegramUsersRepository.updateProfile(telegramId, dto);
    }

    /** Mock subscription — всегда FREE на MVP */
    async getSubscription(telegramId: string): Promise<{ status: SubscriptionStatusEnum }> {
        const status = await this.telegramUsersRepository.getSubscriptionStatus(telegramId);
        return { status };
    }
}
