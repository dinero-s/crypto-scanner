import { ConfigService } from '@nestjs/config';
import { ExchangeEnum } from '../enums/exchange.enum';
import { ExchangeHttpService } from '../services/exchange-http.service';
import { BinanceConnector } from './binance/binance.connector';
import { BybitConnector } from './bybit/bybit.connector';
import { GateConnector } from './gate/gate.connector';
import { KrakenConnector } from './kraken/kraken.connector';
import { KucoinConnector } from './kucoin/kucoin.connector';
import { OkxConnector } from './okx/okx.connector';

type HttpGetMock = jest.Mock<Promise<unknown>, [ExchangeEnum, string]>;

function createConfigService(): ConfigService {
    return {
        get: jest.fn((key: string) => {
            const config: Record<string, unknown> = {
                'exchanges.binanceRestUrl': 'https://api.binance.com',
                'exchanges.binanceFuturesUrl': 'https://fapi.binance.com',
                'exchanges.bybitRestUrl': 'https://api.bybit.com',
                'exchanges.okxRestUrl': 'https://www.okx.com',
                'exchanges.gateRestUrl': 'https://api.gateio.ws',
                'exchanges.kucoinRestUrl': 'https://api.kucoin.com',
                'exchanges.kucoinFuturesUrl': 'https://api-futures.kucoin.com',
                'exchanges.krakenRestUrl': 'https://api.kraken.com',
                'exchanges.krakenFuturesUrl': 'https://futures.kraken.com',
                'exchanges.requestTimeoutMs': 5000,
                'exchanges.retryMaxAttempts': 1,
                'exchanges.retryDelayMs': 100,
                'exchanges.rateLimitIntervalMs': 0,
            };

            return config[key];
        }),
    } as unknown as ConfigService;
}

function createHttpMock(handler: (url: string) => unknown): ExchangeHttpService {
    const getMock: HttpGetMock = jest.fn(
        async (_exchange: ExchangeEnum, url: string) => handler(url),
    );

    return { get: getMock } as unknown as ExchangeHttpService;
}

describe('Exchange connectors smoke (mocked HTTP)', () => {
    const configService = createConfigService();

    it('BinanceConnector возвращает нормализованные spot/perp/funding', async () => {
        const http = createHttpMock((url) => {
            if (url.includes('/api/v3/ticker/24hr')) {
                return [
                    {
                        symbol: 'BTCUSDT',
                        lastPrice: '65000',
                        volume: '100',
                        closeTime: 1_700_000_000_000,
                    },
                ];
            }

            if (url.includes('/api/v3/ticker/bookTicker')) {
                return [{ symbol: 'BTCUSDT', bidPrice: '64999', askPrice: '65001' }];
            }

            if (url.includes('/fapi/v1/ticker/24hr')) {
                return [
                    {
                        symbol: 'BTCUSDT',
                        lastPrice: '65010',
                        volume: '200',
                        closeTime: 1_700_000_000_000,
                    },
                ];
            }

            if (url.includes('/fapi/v1/premiumIndex')) {
                return [
                    {
                        symbol: 'BTCUSDT',
                        markPrice: '65010',
                        indexPrice: '65005',
                        lastFundingRate: '0.0001',
                        nextFundingTime: 1_700_028_800_000,
                    },
                ];
            }

            if (url.includes('/fapi/v1/exchangeInfo')) {
                return {
                    symbols: [
                        {
                            symbol: 'BTCUSDT',
                            baseAsset: 'BTC',
                            quoteAsset: 'USDT',
                            status: 'TRADING',
                            contractType: 'PERPETUAL',
                            filters: [],
                        },
                    ],
                };
            }

            if (url.includes('/fapi/v1/openInterest')) {
                return { symbol: 'BTCUSDT', openInterest: '1000', time: 1_700_000_000_000 };
            }

            if (url.includes('/api/v3/exchangeInfo')) {
                return {
                    symbols: [
                        {
                            symbol: 'BTCUSDT',
                            baseAsset: 'BTC',
                            quoteAsset: 'USDT',
                            status: 'TRADING',
                            filters: [],
                        },
                    ],
                };
            }

            if (url.includes('/ping')) {
                return {};
            }

            return {};
        });

        const connector = new BinanceConnector(http, configService);

        const [spot, perp, funding, oi, instruments, healthy] = await Promise.all([
            connector.getSpotTickers(),
            connector.getPerpTickers(),
            connector.getFundingRates(),
            connector.getOpenInterest(),
            connector.getInstruments(),
            connector.isHealthy(),
        ]);

        expect(spot[0]?.symbol).toBe('BTC/USDT');
        expect(perp[0]?.markPrice).toBe(65010);
        expect(funding[0]?.fundingRate).toBe(0.0001);
        expect(oi[0]?.openInterest).toBe(1000);
        expect(instruments.length).toBeGreaterThan(0);
        expect(healthy).toBe(true);
    });

    it('BybitConnector возвращает нормализованные данные V5', async () => {
        const http = createHttpMock((url) => {
            if (url.includes('/v5/market/time')) {
                return { retCode: 0, retMsg: 'OK', result: { timeSecond: '1700000000' }, time: 1_700_000_000_000 };
            }

            if (url.includes('/v5/market/tickers')) {
                return {
                    retCode: 0,
                    retMsg: 'OK',
                    time: 1_700_000_000_000,
                    result: {
                        list: [
                            {
                                symbol: 'BTCUSDT',
                                lastPrice: '65000',
                                bid1Price: '64999',
                                ask1Price: '65001',
                                volume24h: '1000',
                                markPrice: '65000',
                                indexPrice: '64995',
                                fundingRate: '0.0001',
                                nextFundingTime: '1700028800000',
                                openInterest: '5000',
                            },
                        ],
                    },
                };
            }

            if (url.includes('/v5/market/instruments-info')) {
                return {
                    retCode: 0,
                    retMsg: 'OK',
                    time: 1_700_000_000_000,
                    result: {
                        list: [
                            {
                                symbol: 'BTCUSDT',
                                baseCoin: 'BTC',
                                quoteCoin: 'USDT',
                                status: 'Trading',
                            },
                        ],
                    },
                };
            }

            return {};
        });

        const connector = new BybitConnector(http, configService);
        const spot = await connector.getSpotTickers();
        const perp = await connector.getPerpTickers();
        const funding = await connector.getFundingRates();

        expect(spot[0]?.exchange).toBe(ExchangeEnum.BYBIT);
        expect(perp[0]?.openInterest).toBe(5000);
        expect(funding[0]?.fundingRate).toBe(0.0001);
        expect(await connector.isHealthy()).toBe(true);
    });

    it('OkxConnector возвращает нормализованные данные', async () => {
        const http = createHttpMock((url) => {
            if (url.includes('/api/v5/public/time')) {
                return { code: '0', msg: '', data: [{ ts: '1700000000000' }] };
            }

            if (url.includes('/api/v5/market/tickers')) {
                return {
                    code: '0',
                    msg: '',
                    data: [
                        {
                            instId: 'BTC-USDT',
                            last: '65000',
                            bidPx: '64999',
                            askPx: '65001',
                            vol24h: '100',
                            ts: '1700000000000',
                        },
                        {
                            instId: 'BTC-USDT-SWAP',
                            last: '65010',
                            bidPx: '65009',
                            askPx: '65011',
                            vol24h: '200',
                            ts: '1700000000000',
                        },
                    ],
                };
            }

            if (url.includes('/api/v5/public/funding-rate')) {
                return {
                    code: '0',
                    msg: '',
                    data: [
                        {
                            instId: 'BTC-USDT-SWAP',
                            fundingRate: '0.0001',
                            nextFundingRate: '0.00012',
                            nextFundingTime: '1700028800000',
                            fundingTime: '1700000000000',
                        },
                    ],
                };
            }

            if (url.includes('/api/v5/public/open-interest')) {
                return {
                    code: '0',
                    msg: '',
                    data: [
                        {
                            instId: 'BTC-USDT-SWAP',
                            oi: '1234',
                            oiCcy: '1234',
                            ts: '1700000000000',
                        },
                    ],
                };
            }

            if (url.includes('/api/v5/public/instruments')) {
                return {
                    code: '0',
                    msg: '',
                    data: [
                        {
                            instId: 'BTC-USDT',
                            instType: 'SPOT',
                            baseCcy: 'BTC',
                            quoteCcy: 'USDT',
                            state: 'live',
                            tickSz: '0.1',
                            lotSz: '0.00001',
                            minSz: '0.00001',
                        },
                    ],
                };
            }

            return { code: '0', msg: '', data: [] };
        });

        const connector = new OkxConnector(http, configService);
        const spot = await connector.getSpotTickers();
        const perp = await connector.getPerpTickers();

        expect(spot[0]?.symbol).toBe('BTC/USDT');
        expect(perp[0]?.openInterest).toBe(1234);
    });

    it('GateConnector возвращает нормализованные данные', async () => {
        const http = createHttpMock((url) => {
            if (url.includes('/spot/time')) {
                return { server_time: 1_700_000_000_000 };
            }

            if (url.includes('/spot/tickers')) {
                return [
                    {
                        currency_pair: 'BTC_USDT',
                        last: '65000',
                        highest_bid: '64999',
                        lowest_ask: '65001',
                        base_volume: '100',
                    },
                ];
            }

            if (url.includes('/futures/usdt/tickers')) {
                return [
                    {
                        contract: 'BTC_USDT',
                        last: '65010',
                        highest_bid: '65009',
                        lowest_ask: '65011',
                        volume_24h_base: '200',
                        mark_price: '65010',
                        index_price: '65005',
                        funding_rate: '0.0001',
                        open_interest: '5000',
                    },
                ];
            }

            if (url.includes('/futures/usdt/funding_rate')) {
                return [{ t: 1_700_028_800_000, r: '0.0001', contract: 'BTC_USDT' }];
            }

            if (url.includes('/spot/currency_pairs')) {
                return [
                    {
                        id: 'BTC_USDT',
                        base: 'BTC',
                        quote: 'USDT',
                        trade_status: 'tradable',
                        min_base_amount: '0.0001',
                        min_quote_amount: '1',
                        amount_precision: 4,
                        precision: 2,
                    },
                ];
            }

            if (url.includes('/futures/usdt/contracts')) {
                return [
                    {
                        name: 'BTC_USDT',
                        type: 'direct',
                        quanto_multiplier: '0.0001',
                        order_size_min: 1,
                        order_size_max: 1000000,
                        order_price_round: '0.1',
                        order_size_round: '1',
                        in_delisting: false,
                    },
                ];
            }

            return [];
        });

        const connector = new GateConnector(http, configService);
        const spot = await connector.getSpotTickers();
        const perp = await connector.getPerpTickers();

        expect(spot[0]?.symbol).toBe('BTC/USDT');
        expect(perp[0]?.openInterest).toBe(5000);
    });

    it('KucoinConnector возвращает нормализованные данные', async () => {
        const http = createHttpMock((url) => {
            if (url.includes('/timestamp')) {
                return { code: '200000', data: 1_700_000_000_000 };
            }

            if (url.includes('/api/v1/market/allTickers')) {
                return {
                    code: '200000',
                    data: {
                        ticker: [
                            {
                                symbol: 'BTC-USDT',
                                buy: '64999',
                                sell: '65001',
                                last: '65000',
                                vol: '100',
                                volValue: '6500000',
                            },
                        ],
                    },
                };
            }

            if (url.includes('/api/v2/symbols')) {
                return {
                    code: '200000',
                    data: [
                        {
                            symbol: 'BTC-USDT',
                            baseCurrency: 'BTC',
                            quoteCurrency: 'USDT',
                            enableTrading: true,
                            priceIncrement: '0.1',
                            baseIncrement: '0.00001',
                            baseMinSize: '0.00001',
                            baseMaxSize: '1000',
                        },
                    ],
                };
            }

            if (url.includes('/api/v1/contracts/active')) {
                return {
                    code: '200000',
                    data: [
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
                            turnoverOf24h: 1000000,
                            volumeOf24h: 200,
                        },
                    ],
                };
            }

            if (url.includes('/api/v1/allTickers')) {
                return {
                    code: '200000',
                    data: [
                        {
                            symbol: 'XBTUSDTM',
                            bestBidPrice: 65009,
                            bestAskPrice: 65011,
                            price: 65010,
                            volume: 200,
                        },
                    ],
                };
            }

            return { code: '200000', data: [] };
        });

        const connector = new KucoinConnector(http, configService);
        const spot = await connector.getSpotTickers();
        const perp = await connector.getPerpTickers();
        const funding = await connector.getFundingRates();

        expect(spot[0]?.baseAsset).toBe('BTC');
        expect(perp[0]?.symbol).toBe('BTC/USDT');
        expect(funding[0]?.fundingRate).toBe(0.0001);
    });

    it('KrakenConnector возвращает нормализованные данные', async () => {
        const http = createHttpMock((url) => {
            if (url.includes('/0/public/Ticker')) {
                return {
                    error: [],
                    result: {
                        XBTUSDT: {
                            a: ['65001', '1', '1'],
                            b: ['64999', '1', '1'],
                            c: ['65000', '0.1'],
                            v: ['100', '200'],
                        },
                    },
                };
            }

            if (url.includes('/0/public/AssetPairs')) {
                return {
                    error: [],
                    result: {
                        XBTUSDT: {
                            altname: 'XBTUSDT',
                            base: 'XXBT',
                            quote: 'USDT',
                            status: 'online',
                            pair_decimals: 1,
                            lot_decimals: 8,
                            ordermin: '0.0001',
                        },
                    },
                };
            }

            if (url.includes('/0/public/Time')) {
                return { error: [], result: { unixtime: 1_700_000_000 } };
            }

            if (url.includes('/derivatives/api/v3/tickers')) {
                return {
                    result: 'success',
                    tickers: [
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
                    ],
                };
            }

            if (url.includes('/derivatives/api/v3/instruments')) {
                return {
                    result: 'success',
                    instruments: [
                        {
                            symbol: 'PF_XBTUSD',
                            type: 'flexible_futures',
                            base: 'BTC',
                            quote: 'USD',
                            pair: 'XBT:USD',
                            tradeable: true,
                            contractSize: 1,
                            tickSize: 0.5,
                        },
                    ],
                };
            }

            return {};
        });

        const connector = new KrakenConnector(http, configService);
        const spot = await connector.getSpotTickers();
        const perp = await connector.getPerpTickers();

        expect(spot[0]?.baseAsset).toBe('BTC');
        expect(perp[0]?.symbol).toBe('BTC/USD');
        expect(perp[0]?.openInterest).toBe(500);
    });
});
