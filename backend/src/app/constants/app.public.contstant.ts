import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Опциональная авторизация: при наличии Bearer — валидация и user в request, без токена — пропуск */
export const OPTIONAL_AUTH_KEY = 'optionalAuth';
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);

/** Отключить throttler на конкретном роуте (при THROTTLE_ENABLE=true) */
export const THROTTLE_SKIP_KEY = 'throttleSkip';
export const ThrottleSkip = () => SetMetadata(THROTTLE_SKIP_KEY, true);