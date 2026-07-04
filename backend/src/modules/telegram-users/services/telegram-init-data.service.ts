import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Данные пользователя из Telegram WebApp initData */
export interface TelegramWebAppUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
}

/** Результат валидации initData */
export interface ValidatedTelegramInitData {
    user: TelegramWebAppUser;
    authDate: number;
    queryId?: string;
    chatInstance?: string;
    chatType?: string;
}

/** Валидация Telegram WebApp initData (HMAC-SHA256) */
@Injectable()
export class TelegramInitDataService {
    private readonly logger = new Logger(TelegramInitDataService.name);

    constructor(private readonly configService: ConfigService) {}

    /** Проверить подпись initData и вернуть данные пользователя */
    validateInitData(initData: string): ValidatedTelegramInitData {
        const botToken = this.configService.get<string>('telegram.botToken');
        if (!botToken) {
            throw new UnauthorizedException('Telegram bot не настроен');
        }

        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        if (!hash) {
            throw new UnauthorizedException('initData: отсутствует hash');
        }

        params.delete('hash');
        const dataCheckString = [...params.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        const hashBuffer = Buffer.from(hash, 'hex');
        const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
        if (
            hashBuffer.length !== calculatedBuffer.length ||
            !timingSafeEqual(hashBuffer, calculatedBuffer)
        ) {
            throw new UnauthorizedException('initData: неверная подпись');
        }

        const authDateRaw = params.get('auth_date');
        const authDate = authDateRaw ? Number.parseInt(authDateRaw, 10) : 0;
        const maxAgeSec =
            this.configService.get<number>('telegram.initDataMaxAgeSec') ?? 86_400;
        const ageSec = Math.floor(Date.now() / 1000) - authDate;
        if (!Number.isFinite(authDate) || authDate <= 0 || ageSec > maxAgeSec) {
            throw new UnauthorizedException('initData: истёк срок auth_date');
        }

        const userRaw = params.get('user');
        if (!userRaw) {
            throw new UnauthorizedException('initData: отсутствует user');
        }

        let user: TelegramWebAppUser;
        try {
            user = JSON.parse(userRaw) as TelegramWebAppUser;
        } catch {
            throw new UnauthorizedException('initData: некорректный user JSON');
        }

        if (!user.id) {
            throw new UnauthorizedException('initData: отсутствует user.id');
        }

        return {
            user,
            authDate,
            queryId: params.get('query_id') ?? undefined,
            chatInstance: params.get('chat_instance') ?? undefined,
            chatType: params.get('chat_type') ?? undefined,
        };
    }

    /** Безопасная валидация — возвращает null вместо исключения */
    tryValidateInitData(initData: string): ValidatedTelegramInitData | null {
        try {
            return this.validateInitData(initData);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`initData validation failed: ${message}`);
            return null;
        }
    }
}
