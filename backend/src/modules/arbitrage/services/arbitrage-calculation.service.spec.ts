import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { MarketDataCacheService } from 'src/modules/market-data/services/market-data-cache.service';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';
import { ArbitrageFilterService } from './arbitrage-filter.service';
import { ArbitrageScoringService } from './arbitrage-scoring.service';
import { ArbitrageCalculationService } from './arbitrage-calculation.service';
import { NetYieldCalculatorService } from './net-yield-calculator.service';
import { ArbitrageFilterConfig } from '../interfaces/arbitrage-calculation.interface';

describe('ArbitrageCalculationService', () => {
    let service: ArbitrageCalculationService;

    const baseConfig: ArbitrageFilterConfig = {
        minFundingRate: 0.00001,
        minNetYield: 0,
        maxSpread: 5,
        minVolume24h: 1_000,
        allowedExchanges: [ExchangeEnum.BINANCE],
        symbolWhitelist: [],
        symbolBlacklist: [],
        defaultPositionSizeUsd: 10_000,
        spotFeeRate: 0.001,
        futuresFeeRate: 0.0005,
        defaultSlippage: 0.0001,
        opportunityTtlSec: 300,
    };

    const nowMs = 1_700_000_000_000;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArbitrageCalculationService,
                ArbitrageFilterService,
                ArbitrageScoringService,
                NetYieldCalculatorService,
                {
                    provide: MarketDataCacheService,
                    useValue: {
                        getLatestSpot: jest.fn(),
                        getLatestPerp: jest.fn(),
                        getLatestFunding: jest.fn(),
                    },
                },
                {
                    provide: ArbitrageFilterService,
                    useValue: {
                        isExchangeAllowed: jest.fn().mockReturnValue(true),
                        isSymbolAllowed: jest.fn().mockReturnValue(true),
                        hasSufficientVolume: jest.fn().mockReturnValue(true),
                        passesFundingRateFilter: jest.fn().mockReturnValue(true),
                        passesSpreadFilter: jest.fn().mockReturnValue(true),
                        passesNetYieldFilter: jest.fn().mockImplementation((net: number) => net > 0),
                    },
                },
            ],
        }).compile();

        service = module.get(ArbitrageCalculationService);
    });

    it('не создаёт funding opportunity при нулевых ценах', () => {
        const data = {
            spot: [
                {
                    exchange: ExchangeEnum.BINANCE,
                    symbol: 'BTC/USDT',
                    baseAsset: 'BTC',
                    quoteAsset: 'USDT',
                    bid: 0,
                    ask: 0,
                    last: 0,
                    volume24h: 1_000_000,
                    timestamp: nowMs,
                },
            ],
            perp: [
                {
                    exchange: ExchangeEnum.BINANCE,
                    symbol: 'BTC/USDT',
                    baseAsset: 'BTC',
                    quoteAsset: 'USDT',
                    bid: 65_000,
                    ask: 65_001,
                    last: 65_000,
                    markPrice: 65_000,
                    indexPrice: 65_000,
                    volume24h: 1_000_000,
                    openInterest: 1000,
                    timestamp: nowMs,
                },
            ],
            funding: [
                {
                    exchange: ExchangeEnum.BINANCE,
                    symbol: 'BTC/USDT',
                    baseAsset: 'BTC',
                    quoteAsset: 'USDT',
                    fundingRate: 0.001,
                    nextFundingTime: nowMs + 3_600_000,
                    fundingIntervalHours: 8,
                    timestamp: nowMs,
                },
            ],
        };

        const results = service.calculateFundingOpportunities(data, baseConfig, nowMs);
        expect(results).toHaveLength(0);
    });

    it('создаёт cash_carry opportunity при положительном basis', () => {
        const data = {
            spot: [
                {
                    exchange: ExchangeEnum.BINANCE,
                    symbol: 'BTC/USDT',
                    baseAsset: 'BTC',
                    quoteAsset: 'USDT',
                    bid: 64_999,
                    ask: 65_000,
                    last: 65_000,
                    volume24h: 5_000_000,
                    timestamp: nowMs,
                },
            ],
            perp: [
                {
                    exchange: ExchangeEnum.BINANCE,
                    symbol: 'BTC/USDT',
                    baseAsset: 'BTC',
                    quoteAsset: 'USDT',
                    bid: 66_500,
                    ask: 66_501,
                    last: 66_500,
                    markPrice: 66_500,
                    indexPrice: 65_000,
                    volume24h: 5_000_000,
                    openInterest: 1000,
                    timestamp: nowMs,
                },
            ],
            funding: [],
        };

        const results = service.calculateCashCarryOpportunities(data, baseConfig, nowMs);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]?.type).toBe(ArbitrageTypeEnum.CASH_CARRY);
        expect(results[0]?.netYieldPercent).toBeGreaterThan(0);
    });

    it('не создаёт cash_carry при отрицательном net basis', () => {
        const data = {
            spot: [
                {
                    exchange: ExchangeEnum.BINANCE,
                    symbol: 'BTC/USDT',
                    baseAsset: 'BTC',
                    quoteAsset: 'USDT',
                    bid: 65_000,
                    ask: 65_000,
                    last: 65_000,
                    volume24h: 5_000_000,
                    timestamp: nowMs,
                },
            ],
            perp: [
                {
                    exchange: ExchangeEnum.BINANCE,
                    symbol: 'BTC/USDT',
                    baseAsset: 'BTC',
                    quoteAsset: 'USDT',
                    bid: 65_010,
                    ask: 65_011,
                    last: 65_010,
                    markPrice: 65_010,
                    indexPrice: 65_000,
                    volume24h: 5_000_000,
                    openInterest: 1000,
                    timestamp: nowMs,
                },
            ],
            funding: [],
        };

        const results = service.calculateCashCarryOpportunities(data, baseConfig, nowMs);
        expect(results).toHaveLength(0);
    });
});
