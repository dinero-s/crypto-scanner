import { SetMetadata } from '@nestjs/common';

/** Ключ метаданных для TelegramInitDataGuard */
export const TELEGRAM_AUTH_KEY = 'telegramAuth';

/** Декоратор: роут требует валидный Telegram initData */
export const TelegramAuth = (): ReturnType<typeof SetMetadata> =>
    SetMetadata(TELEGRAM_AUTH_KEY, true);
