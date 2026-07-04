const SECRET_KEYS = new Set([
    'apikey',
    'api_key',
    'apiKey',
    'clientid',
    'client_id',
    'clientId',
    'encryptedapikey',
    'encryptedApiKey',
    'token',
    'authorization',
    'password',
    'secret',
    'refreshToken',
    'refresh_token',
]);

/** Удаляет секретные поля из объекта job/payload */
export function sanitizeRecord(
    value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
    if (!value) {
        return undefined;
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
        if (SECRET_KEYS.has(key.toLowerCase()) || SECRET_KEYS.has(key)) {
            continue;
        }
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            result[key] = sanitizeRecord(val as Record<string, unknown>) ?? {};
            continue;
        }
        result[key] = val;
    }
    return result;
}
