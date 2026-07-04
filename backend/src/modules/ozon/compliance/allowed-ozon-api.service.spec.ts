import { ConfigService } from '@nestjs/config';
import { AllowedOzonApiService } from './allowed-ozon-api.service';
import { ComplianceLogService } from './compliance-log.service';
import { ForbiddenActionError } from './errors/forbidden-action.error';
import { OzonApiType } from '../constants/ozon.enums';

describe('AllowedOzonApiService', () => {
    let service: AllowedOzonApiService;

    beforeEach(() => {
        const configService = {
            get: jest.fn((key: string) => {
                if (key === 'ozon.api.sellerBaseUrl') {
                    return 'https://api-seller.ozon.ru';
                }
                if (key === 'ozon.api.performanceBaseUrl') {
                    return 'https://api-performance.ozon.ru';
                }
                if (key === 'ozon.api.statisticsBaseUrl') {
                    return 'https://api-seller.ozon.ru';
                }
                return undefined;
            }),
        } as unknown as ConfigService;

        const complianceLogModel = {
            create: jest.fn().mockResolvedValue({}),
        };

        service = new AllowedOzonApiService(
            configService,
            new ComplianceLogService(complianceLogModel as never),
        );
    });

    it('разрешает официальный Seller API endpoint', () => {
        expect(() =>
            service.assertAllowedRequest(
                OzonApiType.SELLER,
                'https://api-seller.ozon.ru',
                '/v3/product/list',
            ),
        ).not.toThrow();
    });

    it('разрешает Performance API statistics report', () => {
        expect(() =>
            service.assertAllowedRequest(
                OzonApiType.PERFORMANCE,
                'https://api-performance.ozon.ru',
                '/api/client/statistics/report',
            ),
        ).not.toThrow();
    });

    it('блокирует запрос к www.ozon.ru', () => {
        expect(() =>
            service.assertAllowedRequest(
                OzonApiType.SELLER,
                'https://www.ozon.ru',
                '/product/123',
            ),
        ).toThrow(ForbiddenActionError);
    });

    it('блокирует xapi.ozon.ru', () => {
        expect(() =>
            service.assertAllowedRequest(
                OzonApiType.SELLER,
                'https://xapi.ozon.ru',
                '/internal/data',
            ),
        ).toThrow(ForbiddenActionError);
    });

    it('блокирует неразрешённый endpoint', () => {
        expect(() =>
            service.assertAllowedRequest(
                OzonApiType.SELLER,
                'https://api-seller.ozon.ru',
                '/v99/secret/scrape',
            ),
        ).toThrow(ForbiddenActionError);
    });
});
