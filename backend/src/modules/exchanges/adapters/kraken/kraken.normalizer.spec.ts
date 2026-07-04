import { ExchangeEnum } from '../../enums/exchange.enum';
import {
    normalizeKrakenPerpTickers,
    normalizeKrakenSpotTickers,
} from './kraken.normalizer';

describe('KrakenNormalizer', () => {
    it('нормализует spot tickers', () => {
        const result = normalizeKrakenSpotTickers({
            XBTUSDT: {
                a: ['65001', '1', '1'],
                b: ['64999', '1', '1'],
                c: ['65000', '0.1'],
                v: ['100', '200'],
            },
        });

        expect(result[0]).toMatchObject({
            exchange: ExchangeEnum.KRAKEN,
            baseAsset: 'BTC',
            symbol: 'BTC/USDT',
        });
    });

    it('нормализует perp tickers', () => {
        const result = normalizeKrakenPerpTickers([
            {
                symbol: 'PF_XBTUSD',
                last: 65000,
                bid: 64999,
                ask: 65001,
                markPrice: 65000,
                indexPrice: 64995,
                vol24h: 1000,
                openInterest: 500,
                fundingRate: 0.0001,
                fundingRatePrediction: 0.00012,
                nextFundingRateTime: 1_700_028_800_000,
                suspended: false,
            },
        ]);

        expect(result[0]?.symbol).toBe('BTC/USD');
        expect(result[0]?.openInterest).toBe(500);
    });
});
