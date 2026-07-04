import { ExchangeEnum } from '../../enums/exchange.enum';
import {
    normalizeBinanceFundingRates,
    normalizeBinanceOpenInterest,
    normalizeBinancePerpTickers,
    normalizeBinanceSpotTickers,
} from './binance.normalizer';

describe('BinanceNormalizer', () => {
    it('нормализует spot tickers с bid/ask из bookTicker', () => {
        const result = normalizeBinanceSpotTickers(
            [
                {
                    symbol: 'BTCUSDT',
                    lastPrice: '65000.5',
                    volume: '1234.56',
                    closeTime: 1_700_000_000_000,
                },
            ],
            [
                {
                    symbol: 'BTCUSDT',
                    bidPrice: '64999.0',
                    askPrice: '65001.0',
                },
            ],
        );

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            exchange: ExchangeEnum.BINANCE,
            symbol: 'BTC/USDT',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            bid: 64999,
            ask: 65001,
            last: 65000.5,
            volume24h: 1234.56,
            timestamp: 1_700_000_000_000,
        });
    });

    it('нормализует perpetual tickers с mark/index из premiumIndex', () => {
        const result = normalizeBinancePerpTickers(
            [
                {
                    symbol: 'ETHUSDT',
                    lastPrice: '3500',
                    volume: '50000',
                    closeTime: 1_700_000_000_000,
                },
            ],
            [
                {
                    symbol: 'ETHUSDT',
                    markPrice: '3501.2',
                    indexPrice: '3500.8',
                    lastFundingRate: '0.0001',
                    nextFundingTime: 1_700_028_800_000,
                },
            ],
        );

        expect(result[0]).toMatchObject({
            symbol: 'ETH/USDT',
            markPrice: 3501.2,
            indexPrice: 3500.8,
            last: 3500,
            volume24h: 50000,
        });
    });

    it('нормализует funding rates из premiumIndex', () => {
        const result = normalizeBinanceFundingRates([
            {
                symbol: 'BTCUSDT',
                markPrice: '65000',
                indexPrice: '64990',
                lastFundingRate: '0.00015',
                nextFundingTime: 1_700_028_800_000,
            },
        ]);

        expect(result[0]).toMatchObject({
            symbol: 'BTC/USDT',
            fundingRate: 0.00015,
            nextFundingTime: 1_700_028_800_000,
            fundingIntervalHours: 8,
        });
    });

    it('нормализует open interest с доступными данными', () => {
        const result = normalizeBinanceOpenInterest([
            {
                symbol: 'BTCUSDT',
                openInterest: '12345.678',
                time: 1_700_000_000_000,
                available: true,
            },
        ]);

        expect(result[0]).toMatchObject({
            symbol: 'BTC/USDT',
            openInterest: 12345.678,
            openInterestAvailable: true,
            openInterestSource: 'exchange',
            timestamp: 1_700_000_000_000,
        });
    });

    it('сохраняет openInterest null для недоступного символа', () => {
        const result = normalizeBinanceOpenInterest([
            {
                symbol: 'ETHUSDT',
                openInterest: null,
                time: 1_700_000_000_000,
                available: false,
            },
        ]);

        expect(result[0]).toMatchObject({
            symbol: 'ETH/USDT',
            openInterest: null,
            openInterestAvailable: false,
            openInterestSource: null,
        });
    });
});
