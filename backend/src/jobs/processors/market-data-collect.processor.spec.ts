import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import {
    QUEUE_JOB_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { MarketDataCollectorService } from 'src/modules/market-data/services/market-data-collector.service';
import { MarketDataCollectProcessor } from './market-data-collect.processor';

describe('MarketDataCollectProcessor', () => {
    let processor: MarketDataCollectProcessor;
    let collector: jest.Mocked<MarketDataCollectorService>;

    beforeEach(async () => {
        collector = {
            collectInstruments: jest.fn().mockResolvedValue(undefined),
            collectSpotTickers: jest.fn().mockResolvedValue(undefined),
            collectPerpTickers: jest.fn().mockResolvedValue(undefined),
            collectFundingRates: jest.fn().mockResolvedValue(undefined),
            collectOpenInterest: jest.fn().mockResolvedValue(undefined),
            cleanupOldSnapshots: jest.fn().mockResolvedValue(undefined),
            collectAll: jest.fn().mockResolvedValue(undefined),
            getCollectorStatus: jest.fn(),
        } as unknown as jest.Mocked<MarketDataCollectorService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MarketDataCollectProcessor,
                { provide: MarketDataCollectorService, useValue: collector },
            ],
        }).compile();

        processor = module.get(MarketDataCollectProcessor);
    });

    const createJob = (name: string, data: Record<string, unknown> = {}): Job => {
        return {
            id: 'test-job-id',
            name,
            data: { scheduledAt: Date.now(), ...data },
        } as Job;
    };

    it('вызывает collectInstruments для SCANNER_COLLECT_INSTRUMENTS', async () => {
        await processor.process(createJob(QUEUE_JOB_NAMES.SCANNER_COLLECT_INSTRUMENTS));
        expect(collector.collectInstruments).toHaveBeenCalledTimes(1);
    });

    it('вызывает collectSpotTickers для SCANNER_COLLECT_SPOT_TICKERS', async () => {
        await processor.process(createJob(QUEUE_JOB_NAMES.SCANNER_COLLECT_SPOT_TICKERS));
        expect(collector.collectSpotTickers).toHaveBeenCalledTimes(1);
    });

    it('вызывает collectPerpTickers для SCANNER_COLLECT_PERP_TICKERS', async () => {
        await processor.process(createJob(QUEUE_JOB_NAMES.SCANNER_COLLECT_PERP_TICKERS));
        expect(collector.collectPerpTickers).toHaveBeenCalledTimes(1);
    });

    it('вызывает collectFundingRates для SCANNER_COLLECT_FUNDING_RATES', async () => {
        await processor.process(createJob(QUEUE_JOB_NAMES.SCANNER_COLLECT_FUNDING_RATES));
        expect(collector.collectFundingRates).toHaveBeenCalledTimes(1);
    });

    it('вызывает collectOpenInterest для SCANNER_COLLECT_OPEN_INTEREST', async () => {
        await processor.process(createJob(QUEUE_JOB_NAMES.SCANNER_COLLECT_OPEN_INTEREST));
        expect(collector.collectOpenInterest).toHaveBeenCalledTimes(1);
    });

    it('вызывает cleanupOldSnapshots для SCANNER_CLEANUP_SNAPSHOTS', async () => {
        await processor.process(createJob(QUEUE_JOB_NAMES.SCANNER_CLEANUP_SNAPSHOTS));
        expect(collector.cleanupOldSnapshots).toHaveBeenCalledTimes(1);
    });

    it('вызывает collectAll для legacy SCANNER_MARKET_DATA_COLLECT', async () => {
        const jobData = {
            exchanges: ['binance'],
            symbols: ['BTC/USDT'],
            scheduledAt: Date.now(),
        };
        await processor.process(
            createJob(QUEUE_JOB_NAMES.SCANNER_MARKET_DATA_COLLECT, jobData),
        );
        expect(collector.collectAll).toHaveBeenCalledWith({
            exchanges: jobData.exchanges,
            symbols: jobData.symbols,
            force: undefined,
        });
    });

    it('игнорирует неизвестный job name', async () => {
        await processor.process(createJob('unknown-job'));
        expect(collector.collectSpotTickers).not.toHaveBeenCalled();
    });
});
