import { ExchangeEnum } from '../../enums/exchange.enum';
import {
    normalizeBybitFundingRates,
    normalizeBybitPerpTickers,
    normalizeBybitSpotTickers,
} from './bybit.normalizer';

describe('BybitNormalizer', () => {
    const snapshotTime = 1_700_000_000_000;

    it('нормализует spot tickers V5', () => {
        const result = normalizeBybitSpotTickers(
            [
                {
                    symbol: 'BTCUSDT',
                    lastPrice: '65000',
                    bid1Price: '64999',
                    ask1Price: '65001',
                    volume24h: '1000',
                },
            ],
            snapshotTime,
        );

        expect(result[0]).toMatchObject({
            exchange: ExchangeEnum.BYBIT,
            symbol: 'BTC/USDT',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            bid: 64999,
            ask: 65001,
            last: 65000,
            volume24h: 1000,
            timestamp: snapshotTime,
        });
    });

    it('нормализует linear perpetual tickers с OI', () => {
        const result = normalizeBybitPerpTickers(
            [
                {
                    symbol: 'ETHUSDT',
                    lastPrice: '3500',
                    bid1Price: '3499',
                    ask1Price: '3501',
                    volume24h: '20000',
                    markPrice: '3500.5',
                    indexPrice: '3500.1',
                    openInterest: '150000',
                },
            ],
            snapshotTime,
        );

        expect(result[0]).toMatchObject({
            symbol: 'ETH/USDT',
            markPrice: 3500.5,
            indexPrice: 3500.1,
            openInterest: 150000,
        });
    });

    it('нормализует funding rates из linear tickers', () => {
        const result = normalizeBybitFundingRates(
            [
                {
                    symbol: 'BTCUSDT',
                    lastPrice: '65000',
                    bid1Price: '64999',
                    ask1Price: '65001',
                    volume24h: '1000',
                    fundingRate: '0.00012',
                    nextFundingTime: '1700028800000',
                },
            ],
            snapshotTime,
        );

        expect(result[0]).toMatchObject({
            symbol: 'BTC/USDT',
            fundingRate: 0.00012,
            predictedFundingRate: 0.00012,
            nextFundingTime: 1_700_028_800_000,
            fundingIntervalHours: 8,
        });
    });
});
