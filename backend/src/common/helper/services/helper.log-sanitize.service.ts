/** Ключи, которые не должны попадать в логи (пароли, токены и т.д.) */
const SENSITIVE_KEYS = new Set([
    'password',
    'passwordConfirm',
    'oldPassword',
    'newPassword',
    'token',
    'accessToken',
    'refreshToken',
    'refresh_token',
    'access_token',
    'authorization',
    'Authorization',
    'cookie',
    'Cookie',
    'secret',
    'apiKey',
    'api_key',
]);

/**
 * Удаляет чувствительные поля из объекта перед логированием.
 * Не мутирует исходный объект.
 */
export function sanitizeForLog<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    if (obj === null || typeof obj !== 'object') {
        return obj as unknown as Record<string, unknown>;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(keyLower)) {
            out[key] = '[REDACTED]';
            continue;
        }
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            out[key] = sanitizeForLog(value as Record<string, unknown>);
        } else {
            out[key] = value;
        }
    }
    return out;
}
