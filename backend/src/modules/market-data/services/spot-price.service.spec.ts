import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { MarketDataRepository } from '../repositories/market-data.repository';
import { ExchangeHealthService } from './exchange-health.service';
import { MarketDataCacheService } from './market-data-cache.service';
import { SpotPriceService } from './spot-price.service';

describe('SpotPriceService', () => {
    let service: SpotPriceService;
    let registry: jest.Mocked<ExchangeRegistryService>;
    let repository: jest.Mocked<MarketDataRepository>;
    let cacheService: jest.Mocked<MarketDataCacheService>;
    let healthService: jest.Mocked<ExchangeHealthService>;

    const mockTickers = [
        {
            exchange: ExchangeEnum.BINANCE,
            symbol: 'BTC/USDT',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            bid: 65000,
            ask: 65001,
            last: 65000.5,
            volume24h: 1000,
            timestamp: Date.now(),
        },
    ];

    beforeEach(async () => {
        registry = {
            getConnector: jest.fn().mockReturnValue({
                getSpotTickers: jest.fn().mockResolvedValue(mockTickers),
            }),
        } as unknown as jest.Mocked<ExchangeRegistryService>;

        repository = {
            insertSpotTickers: jest.fn().mockResolvedValue(1),
            saveSnapshot: jest.fn().mockResolvedValue({}),
        } as unknown as jest.Mocked<MarketDataRepository>;

        cacheService = {
            setLatestSpot: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<MarketDataCacheService>;

        healthService = {
            collectPerExchange: jest.fn().mockImplementation(async (fetcher) => {
                return fetcher(ExchangeEnum.BINANCE);
            }),
        } as unknown as jest.Mocked<ExchangeHealthService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SpotPriceService,
                { provide: ExchangeRegistryService, useValue: registry },
                { provide: MarketDataRepository, useValue: repository },
                { provide: MarketDataCacheService, useValue: cacheService },
                { provide: ExchangeHealthService, useValue: healthService },
            ],
        }).compile();

        service = module.get(SpotPriceService);
    });

    it('сохраняет tickers в Mongo и обновляет Redis-кэш', async () => {
        const saved = await service.collectAll();

        expect(saved).toBe(1);
        expect(healthService.collectPerExchange).toHaveBeenCalled();
        expect(repository.insertSpotTickers).toHaveBeenCalledWith(mockTickers);
        expect(cacheService.setLatestSpot).toHaveBeenCalledWith(mockTickers);
        expect(repository.saveSnapshot).toHaveBeenCalled();
    });

    it('не падает при ошибке одной биржи (partial results через healthService)', async () => {
        healthService.collectPerExchange.mockResolvedValue(mockTickers);

        await expect(service.collectAll()).resolves.toBe(1);
    });
});
