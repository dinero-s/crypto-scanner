import { ExchangeEnum } from '../../enums/exchange.enum';
import {
    normalizeKucoinFundingRates,
    normalizeKucoinPerpTickers,
    normalizeKucoinSpotTickers,
} from './kucoin.normalizer';

describe('KucoinNormalizer', () => {
    it('нормализует spot tickers', () => {
        const result = normalizeKucoinSpotTickers([
            {
                symbol: 'BTC-USDT',
                buy: '64999',
                sell: '65001',
                last: '65000',
                vol: '100',
                volValue: '6500000',
            },
        ]);

        expect(result[0]).toMatchObject({
            exchange: ExchangeEnum.KUCOIN,
            symbol: 'BTC/USDT',
            baseAsset: 'BTC',
        });
    });

    it('нормализует perp tickers', () => {
        const contracts = [
            {
                symbol: 'XBTUSDTM',
                baseCurrency: 'XBT',
                quoteCurrency: 'USDT',
                status: 'Open',
                tickSize: 0.1,
                lotSize: 1,
                fundingFeeRate: 0.0001,
                predictedFundingFeeRate: 0.00012,
                fundingRateGranularity: 28_800_000,
                nextFundingRateTime: 1_700_028_800_000,
                openInterest: '1000',
                markPrice: 65010,
                indexPrice: 65005,
                turnoverOf24h: 1_000_000,
                volumeOf24h: 200,
            },
        ];
        const tickers = [
            {
                symbol: 'XBTUSDTM',
                bestBidPrice: 65009,
                bestAskPrice: 65011,
                price: 65010,
                volume: 200,
            },
        ];

        const result = normalizeKucoinPerpTickers(contracts, tickers);

        expect(result[0]?.symbol).toBe('BTC/USDT');
        expect(result[0]?.openInterest).toBe(1000);
    });

    it('нормализует funding rates', () => {
        const result = normalizeKucoinFundingRates([
            {
                symbol: 'XBTUSDTM',
                baseCurrency: 'XBT',
                quoteCurrency: 'USDT',
                status: 'Open',
                tickSize: 0.1,
                lotSize: 1,
                fundingFeeRate: 0.0001,
                predictedFundingFeeRate: 0.00012,
                fundingRateGranularity: 28_800_000,
                nextFundingRateTime: 1_700_028_800_000,
                openInterest: '1000',
                markPrice: 65010,
                indexPrice: 65005,
                turnoverOf24h: 1_000_000,
                volumeOf24h: 200,
            },
        ]);

        expect(result[0]?.fundingRate).toBe(0.0001);
    });
});
