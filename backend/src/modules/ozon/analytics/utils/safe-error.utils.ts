const SENSITIVE_PATTERNS = [
    /client[_-]?id\s*[:=]\s*\S+/gi,
    /api[_-]?key\s*[:=]\s*\S+/gi,
    /client[_-]?secret\s*[:=]\s*\S+/gi,
    /bearer\s+\S+/gi,
    /password\s*[:=]\s*\S+/gi,
    /token\s*[:=]\s*\S+/gi,
];

/** Безопасное сообщение об ошибке без секретов */
export function toSafeErrorMessage(error: unknown): string {
    const raw =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Неизвестная ошибка аудита';

    let sanitized = raw;
    for (const pattern of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[скрыто]');
    }

    if (sanitized.length > 500) {
        return `${sanitized.slice(0, 500)}…`;
    }

    return sanitized;
}
