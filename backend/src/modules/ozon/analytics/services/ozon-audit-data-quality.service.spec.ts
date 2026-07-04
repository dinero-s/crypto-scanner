import { Types } from 'mongoose';
import { OzonAuditDataQualityService } from './ozon-audit-data-quality.service';

describe('OzonAuditDataQualityService', () => {
    const userId = new Types.ObjectId().toString();
    const integrationId = new Types.ObjectId().toString();

    const sellerProductModel = {
        find: jest.fn(),
    };
    const metricSnapshotModel = {
        find: jest.fn(),
    };
    const sellerReportModel = {
        find: jest.fn(),
    };

    const service = new OzonAuditDataQualityService(
        sellerProductModel as never,
        metricSnapshotModel as never,
        sellerReportModel as never,
    );

    beforeEach(() => {
        jest.clearAllMocks();
        const today = new Date();
        const snapshots = Array.from({ length: 14 }, (_, index) => {
            const date = new Date(today.getTime() - (13 - index) * 24 * 60 * 60 * 1000);
            return {
                date,
                price: 1000,
                stockAvailable: 5,
                unitsSold: 10,
                adSpend: 500,
                returnsCount: 1,
                grossProfitEstimate: 300,
            };
        });

        sellerProductModel.find.mockReturnValue({
            exec: async () => [{ price: 1000, stockPresent: 5 }],
        });
        metricSnapshotModel.find.mockReturnValue({
            exec: async () => snapshots,
        });
        sellerReportModel.find.mockReturnValue({
            limit: () => ({
                exec: async () => [{ reportType: 'finance' }],
            }),
        });
    });

    it('возвращает высокий score при полных данных', async () => {
        const result = await service.assess(userId, integrationId);

        expect(result.score).toBeGreaterThanOrEqual(80);
        expect(result.hasProductsData).toBe(true);
        expect(result.hasAdsData).toBe(true);
        expect(result.missingData).toHaveLength(0);
    });

    it('отражает отсутствие рекламных данных', async () => {
        metricSnapshotModel.find.mockReturnValue({
            exec: async () => [
                {
                    price: 1000,
                    stockAvailable: 5,
                    unitsSold: 10,
                    returnsCount: 1,
                },
            ],
        });
        sellerReportModel.find.mockReturnValue({
            limit: () => ({ exec: async () => [] }),
        });

        const result = await service.assess(userId, integrationId);

        expect(result.hasAdsData).toBe(false);
        expect(result.missingData.some((m) => m.type === 'ADS')).toBe(true);
        expect(result.score).toBeLessThanOrEqual(80);
    });

    it('возвращает низкий score без товаров', async () => {
        sellerProductModel.find.mockReturnValue({ exec: async () => [] });
        metricSnapshotModel.find.mockReturnValue({ exec: async () => [] });
        sellerReportModel.find.mockReturnValue({
            limit: () => ({ exec: async () => [] }),
        });

        const result = await service.assess(userId, integrationId);

        expect(result.hasProductsData).toBe(false);
        expect(result.missingData.some((m) => m.type === 'PRODUCTS')).toBe(true);
    });

    it('возвращает detectorAvailability для всех детекторов', async () => {
        const result = await service.assess(userId, integrationId);

        expect(result.detectorAvailability).toBeDefined();
        expect(result.detectorAvailability.stockoutRisk.status).toBe('READY');
        expect(result.detectorAvailability.overstock.status).toBe('READY');
        expect(result.detectorAvailability.adsWaste.status).toBe('READY');
        expect(result.detectorAvailability.priceLeak.status).toBe('READY');
        expect(result.detectorAvailability.returnSpike.status).toBe('READY');
        expect(result.checkedDetectorsCount).toBe(5);
        expect(result.availableDetectorsCount).toBe(5);
    });

    it('помечает adsWaste как NOT_AVAILABLE при NO_ADS_DATA', async () => {
        metricSnapshotModel.find.mockReturnValue({
            exec: async () => [
                {
                    price: 1000,
                    stockAvailable: 5,
                    unitsSold: 10,
                    returnsCount: 1,
                },
            ],
        });
        sellerReportModel.find.mockReturnValue({
            limit: () => ({ exec: async () => [] }),
        });

        const result = await service.assess(userId, integrationId);

        expect(result.detectorAvailability.adsWaste.status).toBe('NOT_AVAILABLE');
        expect(result.detectorAvailability.adsWaste.reason).toBe('NO_ADS_DATA');
        expect(result.unavailableDetectorsCount).toBeGreaterThanOrEqual(1);
    });

    it('помечает returnSpike как NOT_AVAILABLE при NO_RETURNS_DATA', async () => {
        metricSnapshotModel.find.mockReturnValue({
            exec: async () => [
                {
                    price: 1000,
                    stockAvailable: 5,
                    unitsSold: 10,
                    adSpend: 500,
                },
            ],
        });

        const result = await service.assess(userId, integrationId);

        expect(result.detectorAvailability.returnSpike.status).toBe('NOT_AVAILABLE');
        expect(result.detectorAvailability.returnSpike.reason).toBe('NO_RETURNS_DATA');
    });

    it('помечает priceLeak как PARTIAL при NO_PRICE_HISTORY', async () => {
        metricSnapshotModel.find.mockReturnValue({
            exec: async () => [
                {
                    date: new Date(),
                    price: 1000,
                    stockAvailable: 5,
                    unitsSold: 10,
                    adSpend: 500,
                    returnsCount: 1,
                },
            ],
        });

        const result = await service.assess(userId, integrationId, 30);

        expect(result.detectorAvailability.priceLeak.status).toBe('PARTIAL');
        expect(result.detectorAvailability.priceLeak.reason).toBe('NO_PRICE_HISTORY');
        expect(result.partialDetectorsCount).toBeGreaterThanOrEqual(1);
    });

    it('resolveState: score >= 80 → READY, 40–79 → PARTIAL_DATA, < 40 → INSUFFICIENT_DATA', async () => {
        const fullResult = await service.assess(userId, integrationId);
        expect(fullResult.state).toBe('READY');
        expect(fullResult.score).toBeGreaterThanOrEqual(80);

        metricSnapshotModel.find.mockReturnValue({
            exec: async () => [
                {
                    price: 1000,
                    stockAvailable: 5,
                    unitsSold: 10,
                },
            ],
        });
        sellerReportModel.find.mockReturnValue({
            limit: () => ({ exec: async () => [] }),
        });

        const partialResult = await service.assess(userId, integrationId);
        expect(partialResult.score).toBeLessThan(80);
        expect(partialResult.score).toBeGreaterThanOrEqual(40);
        expect(partialResult.state).toBe('PARTIAL_DATA');

        sellerProductModel.find.mockReturnValue({ exec: async () => [] });
        metricSnapshotModel.find.mockReturnValue({ exec: async () => [] });

        const insufficientResult = await service.assess(userId, integrationId);
        expect(insufficientResult.score).toBeLessThan(40);
        expect(insufficientResult.state).toBe('INSUFFICIENT_DATA');
    });
});
