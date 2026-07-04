import { ForbiddenActionError } from '../../compliance/errors/forbidden-action.error';
import {
    isValidOzonProductUrl,
    normalizeOzonProductUrl,
    parseOzonReference,
    resolveCompetitorIdentifiers,
} from './ozon-url.parser';

describe('ozon-url.parser', () => {
    it('нормализует URL карточки', () => {
        const normalized = normalizeOzonProductUrl(
            'https://www.ozon.ru/product/test-123/?utm_source=abc',
        );
        expect(normalized).toContain('ozon.ru/product');
    });

    it('валидирует URL Ozon', () => {
        expect(isValidOzonProductUrl('https://www.ozon.ru/product/test-123/')).toBe(true);
        expect(isValidOzonProductUrl('https://example.com/product/1')).toBe(false);
    });

    it('извлекает product_id из URL без HTTP-запроса', () => {
        const result = parseOzonReference(
            'https://www.ozon.ru/product/smartphone-apple-iphone-15-1234567890/',
        );

        expect(result.productId).toBe('1234567890');
        expect(result.urlReference).toContain('ozon.ru');
    });

    it('извлекает SKU из query-параметра URL', () => {
        const result = parseOzonReference(
            'https://www.ozon.ru/product/item-999/?sku=555555',
        );

        expect(result.productId).toBe('999');
        expect(result.sku).toBe('555555');
    });

    it('принимает числовой идентификатор как product_id', () => {
        const result = parseOzonReference('9876543210');
        expect(result.productId).toBe('9876543210');
    });

    it('объединяет явные поля и URL', () => {
        const result = resolveCompetitorIdentifiers({
            sku: '111',
            url: 'https://www.ozon.ru/product/test-222/',
        });

        expect(result.sku).toBe('111');
        expect(result.productId).toBe('222');
    });
});

describe('ForbiddenActionError', () => {
    it('содержит compliance-флаг', () => {
        const error = new ForbiddenActionError('test', 'html_scraping');
        expect(error.getResponse()).toMatchObject({
            compliance: true,
            reason: 'html_scraping',
        });
    });
});
