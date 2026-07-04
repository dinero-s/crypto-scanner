import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramAuthDto, UpdateTelegramUserDto } from '../dto/telegram-user.dto';
import { TelegramUsersRepository } from '../repositories/telegram-users.repository';
import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';
import { TelegramInitDataService } from './telegram-init-data.service';

/** Бизнес-логика Telegram-пользователей */
@Injectable()
export class TelegramUsersService {
    private readonly logger = new Logger(TelegramUsersService.name);

    constructor(
        private readonly telegramUsersRepository: TelegramUsersRepository,
        private readonly configService: ConfigService,
        private readonly initDataService: TelegramInitDataService,
    ) {}

    /** Авторизация через initData с HMAC-валидацией */
    async authenticate(dto: TelegramAuthDto) {
        const botToken = this.configService.get<string>('telegram.botToken');
        if (!botToken) {
            throw new UnauthorizedException('TELEGRAM_BOT_TOKEN не задан');
        }

        const validated = this.initDataService.validateInitData(dto.initData);
        const user = validated.user;

        const doc = await this.upsertUser({
            telegramId: String(user.id),
            chatId: String(user.id),
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            languageCode: user.language_code ?? 'ru',
        });

        this.logger.log(`authenticated telegramId=${String(user.id)}`);

        return {
            authenticated: true,
            user: {
                telegramId: doc.telegramId,
                username: doc.username,
                firstName: doc.firstName,
                lastName: doc.lastName,
                subscriptionStatus: doc.subscriptionStatus,
                languageCode: doc.languageCode,
            },
        };
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
