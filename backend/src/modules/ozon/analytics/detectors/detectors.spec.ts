import { ConfigService } from '@nestjs/config';
import { AdsWasteDetector } from './ads-waste.detector';
import { OverstockDetector } from './overstock.detector';
import { PriceLeakDetector } from './price-leak.detector';
import { ReturnSpikeDetector } from './return-spike.detector';
import { StockoutRiskDetector } from './stockout-risk.detector';
import { OzonDetectedIssueType, OzonAuditSeverity } from '../../constants/ozon.enums';
import { MetricSnapshotView } from '../interfaces/audit.interfaces';
import { startOfDayUtc } from '../metrics/metric-utils';

function createConfig(overrides: Record<string, number> = {}): ConfigService {
    const defaults: Record<string, number> = {
        'ozon.audit.stockoutDaysThreshold': 14,
        'ozon.audit.overstockDaysThreshold': 120,
        'ozon.audit.minAdSpendForIssue': 500,
        'ozon.audit.minAdOrders': 1,
        'ozon.audit.maxAllowedDrr': 0.25,
        'ozon.audit.priceDropPercentThreshold': 0.05,
        'ozon.audit.minReturnsCount': 3,
        ...overrides,
    };

    return {
        get: (key: string) => defaults[key],
    } as ConfigService;
}

function buildSnapshots(
    days: number,
    factory: (dayIndex: number, date: Date) => Partial<MetricSnapshotView>,
): MetricSnapshotView[] {
    const result: MetricSnapshotView[] = [];
    const today = startOfDayUtc(new Date());

    for (let i = days - 1; i >= 0; i -= 1) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        result.push({
            userId: 'user1',
            integrationId: 'int1',
            productId: 'prod1',
            offerId: 'offer1',
            sku: 'SKU-123',
            date,
            stockAvailable: 10,
            unitsSold: 2,
            price: 1000,
            ...factory(days - 1 - i, date),
        });
    }

    return result;
}

describe('StockoutRiskDetector', () => {
    it('создаёт issue при низком stockDaysLeft и продажах', () => {
        const detector = new StockoutRiskDetector(createConfig());
        const snapshots = buildSnapshots(30, () => ({
            stockAvailable: 4,
            unitsSold: 2,
        }));

        const issue = detector.detect(snapshots, new Date());
        expect(issue).not.toBeNull();
        expect(issue?.type).toBe(OzonDetectedIssueType.STOCKOUT_RISK);
        expect(issue?.severity).toBe(OzonAuditSeverity.CRITICAL);
    });

    it('не создаёт issue без продаж', () => {
        const detector = new StockoutRiskDetector(createConfig());
        const snapshots = buildSnapshots(30, () => ({
            stockAvailable: 10,
            unitsSold: 0,
        }));

        expect(detector.detect(snapshots, new Date())).toBeNull();
    });
});

describe('OverstockDetector', () => {
    it('создаёт issue при большом stockDaysLeft', () => {
        const detector = new OverstockDetector(createConfig());
        const snapshots = buildSnapshots(30, () => ({
            stockAvailable: 500,
            unitsSold: 1,
            price: 1000,
        }));

        const issue = detector.detect(snapshots, new Date());
        expect(issue?.type).toBe(OzonDetectedIssueType.OVERSTOCK);
    });
});

describe('AdsWasteDetector', () => {
    it('создаёт issue при высоком adSpend и нулевых заказах', () => {
        const detector = new AdsWasteDetector(createConfig());
        const snapshots = buildSnapshots(7, () => ({
            adSpend: 200,
            adOrders: 0,
            revenue: 0,
        }));

        const issue = detector.detect(snapshots, new Date());
        expect(issue?.type).toBe(OzonDetectedIssueType.ADS_WASTE);
    });

    it('возвращает null без рекламных данных', () => {
        const detector = new AdsWasteDetector(createConfig());
        const snapshots = buildSnapshots(7, () => ({
            adSpend: 0,
            adOrders: 0,
        }));

        expect(detector.detect(snapshots, new Date())).toBeNull();
    });
});

describe('PriceLeakDetector', () => {
    it('создаёт issue при снижении цены без роста продаж', () => {
        const detector = new PriceLeakDetector(createConfig());
        const snapshots = buildSnapshots(20, (dayIndex) => {
            if (dayIndex < 10) {
                return { price: 1000, unitsSold: 5, grossProfitEstimate: 1500 };
            }
            return { price: 800, unitsSold: 5, grossProfitEstimate: 1000 };
        });

        const issue = detector.detect(snapshots, new Date());
        expect(issue?.type).toBe(OzonDetectedIssueType.PRICE_LEAK);
    });
});

describe('ReturnSpikeDetector', () => {
    it('создаёт issue при высокой доле возвратов', () => {
        const detector = new ReturnSpikeDetector(createConfig());
        const snapshots = buildSnapshots(30, () => ({
            returnsCount: 5,
            unitsSold: 10,
        }));

        const issue = detector.detect(snapshots, new Date(), 0.05);
        expect(issue?.type).toBe(OzonDetectedIssueType.RETURN_SPIKE);
    });
});
