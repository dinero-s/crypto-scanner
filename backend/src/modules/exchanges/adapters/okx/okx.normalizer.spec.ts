import { ExchangeEnum } from '../../enums/exchange.enum';
import {
    normalizeOkxFundingRates,
    normalizeOkxOpenInterest,
    normalizeOkxPerpTickers,
    normalizeOkxSpotTickers,
} from './okx.normalizer';

describe('OkxNormalizer', () => {
    it('нормализует spot tickers', () => {
        const result = normalizeOkxSpotTickers([
            {
                instId: 'BTC-USDT',
                last: '65000',
                bidPx: '64999',
                askPx: '65001',
                vol24h: '100',
                ts: '1700000000000',
            },
        ]);

        expect(result[0]).toMatchObject({
            exchange: ExchangeEnum.OKX,
            symbol: 'BTC/USDT',
            bid: 64999,
            ask: 65001,
            last: 65000,
        });
    });

    it('нормализует perp tickers', () => {
        const result = normalizeOkxPerpTickers([
            {
                instId: 'BTC-USDT-SWAP',
                last: '65010',
                bidPx: '65009',
                askPx: '65011',
                vol24h: '200',
                ts: '1700000000000',
            },
        ]);

        expect(result[0]?.symbol).toBe('BTC/USDT');
        expect(result[0]?.volume24h).toBe(200);
    });

    it('нормализует funding rates', () => {
        const result = normalizeOkxFundingRates([
            {
                instId: 'BTC-USDT-SWAP',
                fundingRate: '0.0001',
                nextFundingRate: '0.00012',
                nextFundingTime: '1700028800000',
                fundingTime: '1700000000000',
            },
        ]);

        expect(result[0]).toMatchObject({
            fundingRate: 0.0001,
            predictedFundingRate: 0.00012,
            fundingIntervalHours: 8,
        });
    });

    it('нормализует open interest', () => {
        const result = normalizeOkxOpenInterest([
            {
                instId: 'BTC-USDT-SWAP',
                oi: '1234',
                oiCcy: '1234',
                ts: '1700000000000',
            },
        ]);

        expect(result[0]?.openInterest).toBe(1234);
    });
});
