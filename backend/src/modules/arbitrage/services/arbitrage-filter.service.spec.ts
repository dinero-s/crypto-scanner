import { ConfigService } from '@nestjs/config';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ArbitrageFilterService } from './arbitrage-filter.service';

describe('ArbitrageFilterService', () => {
    const configService = {
        get: jest.fn((key: string) => {
            if (key === 'scanner.enabledExchanges') {
                return Object.values(ExchangeEnum);
            }
            return undefined;
        }),
    } as unknown as ConfigService;

    const service = new ArbitrageFilterService(configService);

    it('пропускает только USDT quote для арбитражных сравнений', () => {
        expect(service.passesQuoteAssetFilter('USDT')).toBe(true);
        expect(service.passesQuoteAssetFilter('USD')).toBe(false);
        expect(service.passesQuoteAssetFilter('USDC')).toBe(false);
    });
});
