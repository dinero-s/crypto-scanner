/** Локальный парсер Ozon URL — без HTTP-запросов к странице */
export interface ParsedOzonReference {
    productId?: string;
    sku?: string;
    urlReference?: string;
    normalizedUrl?: string;
}

/** Проверка, что строка — URL карточки Ozon */
export function isValidOzonProductUrl(input: string): boolean {
    const trimmed = input.trim();
    if (/^\d{5,}$/.test(trimmed)) {
        return true;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return false;
    }

    try {
        const parsed = new URL(trimmed);
        const host = parsed.hostname.toLowerCase();
        if (!host.includes('ozon.ru')) {
            return false;
        }
        return Boolean(parsed.pathname.match(/\/product\//) || parsed.searchParams.get('sku'));
    } catch {
        return false;
    }
}

/** Нормализация URL карточки Ozon */
export function normalizeOzonProductUrl(input: string): string {
    const trimmed = input.trim();

    if (/^\d{5,}$/.test(trimmed)) {
        return `https://www.ozon.ru/product/-${trimmed}/`;
    }

    try {
        const parsed = new URL(trimmed);
        parsed.hash = '';
        parsed.search = parsed.searchParams.has('sku')
            ? `?sku=${parsed.searchParams.get('sku') ?? ''}`
            : '';
        return parsed.toString();
    } catch {
        return trimmed;
    }
}

/** Извлекает product_id/SKU из строки URL или идентификатора локально */
export function parseOzonReference(input: string): ParsedOzonReference {
    const trimmed = input.trim();

    if (/^\d+$/.test(trimmed)) {
        return {
            productId: trimmed,
            normalizedUrl: normalizeOzonProductUrl(trimmed),
        };
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const parsed = parseOzonUrl(trimmed);
        return {
            ...parsed,
            normalizedUrl: normalizeOzonProductUrl(trimmed),
        };
    }

    return { urlReference: trimmed };
}

function parseOzonUrl(url: string): ParsedOzonReference {
    const result: ParsedOzonReference = { urlReference: url };

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();

        if (host.includes('ozon.ru')) {
            const productMatch = parsed.pathname.match(/\/product\/[^/]*-(\d+)/);
            if (productMatch?.[1]) {
                result.productId = productMatch[1];
            }

            const skuParam = parsed.searchParams.get('sku');
            if (skuParam && /^\d+$/.test(skuParam)) {
                result.sku = skuParam;
            }
        }
    } catch {
        const fallbackMatch = url.match(/(\d{5,})/);
        if (fallbackMatch?.[1]) {
            result.productId = fallbackMatch[1];
        }
    }

    return result;
}

/** Объединяет явные поля и результат парсинга URL */
export function resolveCompetitorIdentifiers(input: {
    productId?: string;
    sku?: string;
    offerId?: string;
    url?: string;
}): {
    productId?: string;
    sku?: string;
    offerId?: string;
    urlReference?: string;
    normalizedUrl?: string;
    externalProductId?: string;
} {
    let productId = input.productId;
    let sku = input.sku;
    let urlReference: string | undefined;
    let normalizedUrl: string | undefined;

    if (input.url) {
        const parsed = parseOzonReference(input.url);
        productId = productId ?? parsed.productId;
        sku = sku ?? parsed.sku;
        urlReference = parsed.urlReference ?? parsed.normalizedUrl;
        normalizedUrl = parsed.normalizedUrl ?? normalizeOzonProductUrl(input.url);
    }

    return {
        productId,
        sku,
        offerId: input.offerId,
        urlReference,
        normalizedUrl,
        externalProductId: productId,
    };
}
