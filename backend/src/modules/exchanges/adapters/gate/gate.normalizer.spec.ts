import { ExchangeEnum } from '../../enums/exchange.enum';
import {
    normalizeGateFundingRates,
    normalizeGatePerpTickers,
    normalizeGateSpotTickers,
} from './gate.normalizer';

describe('GateNormalizer', () => {
    it('нормализует spot tickers', () => {
        const result = normalizeGateSpotTickers([
            {
                currency_pair: 'BTC_USDT',
                last: '65000',
                highest_bid: '64999',
                lowest_ask: '65001',
                base_volume: '100',
                quote_volume: '6500000',
            },
        ]);

        expect(result[0]).toMatchObject({
            exchange: ExchangeEnum.GATE,
            symbol: 'BTC/USDT',
            bid: 64999,
            ask: 65001,
        });
    });

    it('нормализует perp tickers', () => {
        const result = normalizeGatePerpTickers([
            {
                contract: 'BTC_USDT',
                last: '65010',
                highest_bid: '65009',
                lowest_ask: '65011',
                volume_24h: '200',
                volume_24h_base: '200',
                mark_price: '65010',
                index_price: '65005',
                funding_rate: '0.0001',
                open_interest: '5000',
            },
        ]);

        expect(result[0]?.openInterest).toBe(5000);
        expect(result[0]?.markPrice).toBe(65010);
    });

    it('нормализует funding rates без ложного nextFundingTime', () => {
        const result = normalizeGateFundingRates([
            { t: 1_700_028_800_000, r: '0.0001', contract: 'BTC_USDT' },
        ]);

        expect(result[0]).toMatchObject({
            symbol: 'BTC/USDT',
            fundingRate: 0.0001,
            nextFundingTime: null,
            nextFundingTimeSource: null,
            fundingIntervalHours: 8,
        });
    });
});
