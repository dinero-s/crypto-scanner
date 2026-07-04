/** Безопасный парсинг числа из ответа биржи */
export function parseExchangeNumber(
    value: string | number | undefined | null,
): number {
    if (value === undefined || value === null || value === '') {
        return 0;
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

/** Парсинг timestamp в unix ms */
export function parseExchangeTimestamp(
    value: string | number | undefined | null,
): number {
    if (value === undefined || value === null || value === '') {
        return Date.now();
    }

    const numeric =
        typeof value === 'number' ? value : Number.parseInt(String(value), 10);

    if (!Number.isFinite(numeric)) {
        return Date.now();
    }

    return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
}

/** Унифицированный символ BASE/QUOTE */
export function buildUnifiedSymbol(baseAsset: string, quoteAsset: string): string {
    return `${baseAsset}/${quoteAsset}`;
}
