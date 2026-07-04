import { Types } from 'mongoose';
import { OzonIssueDetectorService } from './ozon-issue-detector.service';
import {
    OzonAuditDataQualityState,
    OzonAuditSeverity,
    OzonDetectedIssueStatus,
    OzonDetectedIssueType,
    OzonDetectorAvailabilityStatus,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';
import { DetectedIssueDraft } from '../interfaces/audit.interfaces';
import { OzonAuditDataQuality } from '../interfaces/data-quality.interfaces';
import { buildIssueKey } from '../utils/audit-key.utils';
import { startOfDayUtc } from '../metrics/metric-utils';

function buildDataQuality(
    overrides: Partial<OzonAuditDataQuality> = {},
): OzonAuditDataQuality {
    return {
        score: 90,
        state: OzonAuditDataQualityState.READY,
        hasProductsData: true,
        hasPriceData: true,
        hasStockData: true,
        hasSalesData: true,
        hasFinanceData: true,
        hasAdsData: true,
        hasReturnsData: true,
        missingData: [],
        warnings: [],
        detectorAvailability: {
            stockoutRisk: { status: OzonDetectorAvailabilityStatus.READY },
            overstock: { status: OzonDetectorAvailabilityStatus.READY },
            adsWaste: { status: OzonDetectorAvailabilityStatus.READY },
            priceLeak: { status: OzonDetectorAvailabilityStatus.READY },
            returnSpike: { status: OzonDetectorAvailabilityStatus.READY },
        },
        checkedDetectorsCount: 5,
        availableDetectorsCount: 5,
        partialDetectorsCount: 0,
        unavailableDetectorsCount: 0,
        ...overrides,
    };
}

function buildDraft(userId: string, integrationId: string): DetectedIssueDraft {
    return {
        userId,
        integrationId,
        productId: 'prod1',
        offerId: 'offer1',
        sku: 'SKU-1',
        type: OzonDetectedIssueType.STOCKOUT_RISK,
        severity: OzonAuditSeverity.CRITICAL,
        confidence: 0.9,
        estimatedLossMin: 1000,
        estimatedLossMax: 5000,
        lossCalculationConfidence: OzonLossCalculationConfidence.HIGH,
        lossExplanation: 'Потери от OOS',
        title: 'Риск OOS',
        summary: 'Остаток на 3 дня',
        evidence: [{ metric: 'stockDaysLeft', value: 3 }],
    };
}

describe('OzonIssueDetectorService', () => {
    const userId = new Types.ObjectId().toString();
    const integrationId = new Types.ObjectId().toString();
    const auditRunId = new Types.ObjectId().toString();
    const periodTo = new Date('2026-01-31T00:00:00.000Z');
    const periodFrom = new Date('2026-01-01T00:00:00.000Z');

    let findExecMock: jest.Mock;
    let bulkWriteMock: jest.Mock;
    let saveMock: jest.Mock;
    let metricFindMock: jest.Mock;
    let stockoutDetectMock: jest.Mock;
    let service: OzonIssueDetectorService;

    beforeEach(() => {
        findExecMock = jest.fn().mockResolvedValue([]);
        bulkWriteMock = jest.fn().mockResolvedValue({});
        saveMock = jest.fn().mockResolvedValue(undefined);
        metricFindMock = jest.fn();
        stockoutDetectMock = jest.fn();

        const metricSnapshotModel = {
            find: metricFindMock,
        };

        const issueModel = {
            find: jest.fn().mockReturnValue({ exec: findExecMock }),
            bulkWrite: bulkWriteMock,
        };

        const dataQualityService = {
            isDetectorEnabled: (_dq: OzonAuditDataQuality, detector: string) =>
                detector === 'stockoutRisk',
        };

        const stockoutRiskDetector = { detect: stockoutDetectMock };
        const overstockDetector = { detect: jest.fn().mockReturnValue(null) };
        const adsWasteDetector = { detect: jest.fn().mockReturnValue(null) };
        const priceLeakDetector = { detect: jest.fn().mockReturnValue(null) };
        const returnSpikeDetector = { detect: jest.fn().mockReturnValue(null) };

        service = new OzonIssueDetectorService(
            metricSnapshotModel as never,
            issueModel as never,
            stockoutRiskDetector as never,
            overstockDetector as never,
            adsWasteDetector as never,
            priceLeakDetector as never,
            returnSpikeDetector as never,
            dataQualityService as never,
        );

        const today = startOfDayUtc(periodTo);
        metricFindMock.mockReturnValue({
            sort: () => ({
                exec: async () => [
                    {
                        userId: new Types.ObjectId(userId),
                        integrationId: new Types.ObjectId(integrationId),
                        productId: 'prod1',
                        offerId: 'offer1',
                        sku: 'SKU-1',
                        date: today,
                        stockAvailable: 4,
                        unitsSold: 2,
                        price: 1000,
                    },
                ],
            }),
        });

        stockoutDetectMock.mockReturnValue(buildDraft(userId, integrationId));
    });

    it('не создаёт дубль active issue — обновляет существующую NEW', async () => {
        const draft = buildDraft(userId, integrationId);
        const issueKey = buildIssueKey(
            draft.userId,
            draft.integrationId,
            draft.offerId,
            draft.productId,
            draft.type,
        );

        const existingIssue = {
            _id: new Types.ObjectId(),
            issueKey,
            status: OzonDetectedIssueStatus.NEW,
            severity: OzonAuditSeverity.HIGH,
        };

        findExecMock
            .mockResolvedValueOnce([existingIssue])
            .mockResolvedValueOnce([existingIssue]);

        const result = await service.detectIssues(
            userId,
            integrationId,
            buildDataQuality(),
            auditRunId,
            periodFrom,
            periodTo,
            30,
        );

        expect(bulkWriteMock).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    updateOne: expect.objectContaining({
                        filter: { _id: existingIssue._id },
                    }),
                }),
            ]),
            { ordered: false },
        );
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(existingIssue);
    });

    it('обновляет существующую VIEWED issue', async () => {
        const draft = buildDraft(userId, integrationId);
        const existingIssue = {
            _id: new Types.ObjectId(),
            issueKey: buildIssueKey(
                draft.userId,
                draft.integrationId,
                draft.offerId,
                draft.productId,
                draft.type,
            ),
            status: OzonDetectedIssueStatus.VIEWED,
            confidence: 0.5,
        };

        findExecMock
            .mockResolvedValueOnce([existingIssue])
            .mockResolvedValueOnce([existingIssue]);

        await service.detectIssues(
            userId,
            integrationId,
            buildDataQuality(),
            auditRunId,
            periodFrom,
            periodTo,
            30,
        );

        expect(bulkWriteMock).toHaveBeenCalled();
        expect(saveMock).not.toHaveBeenCalled();
    });

    it('создаёт новую issue после FIXED при повторном обнаружении', async () => {
        const newIssue = { _id: new Types.ObjectId() };

        findExecMock
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([newIssue]);

        const result = await service.detectIssues(
            userId,
            integrationId,
            buildDataQuality(),
            auditRunId,
            periodFrom,
            periodTo,
            30,
        );

        expect(bulkWriteMock).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    updateOne: expect.objectContaining({
                        upsert: true,
                    }),
                }),
            ]),
            { ordered: false },
        );
        expect(result).toHaveLength(1);
    });

    it('не вызывает детектор, если он NOT_AVAILABLE', async () => {
        const dataQuality = buildDataQuality({
            detectorAvailability: {
                stockoutRisk: {
                    status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE,
                    reason: 'NO_STOCK_DATA',
                },
                overstock: { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE },
                adsWaste: { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE },
                priceLeak: { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE },
                returnSpike: { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE },
            },
        });

        const dataQualityService = {
            isDetectorEnabled: (_dq: OzonAuditDataQuality, detector: string) =>
                detector !== 'stockoutRisk',
        };

        const stockoutRiskDetector = { detect: stockoutDetectMock };

        const localService = new OzonIssueDetectorService(
            { find: metricFindMock } as never,
            {
                find: jest.fn().mockReturnValue({ exec: findExecMock }),
                bulkWrite: bulkWriteMock,
            } as never,
            stockoutRiskDetector as never,
            { detect: jest.fn() } as never,
            { detect: jest.fn() } as never,
            { detect: jest.fn() } as never,
            { detect: jest.fn() } as never,
            dataQualityService as never,
        );

        findExecMock.mockResolvedValue([]);

        const result = await localService.detectIssues(
            userId,
            integrationId,
            dataQuality,
            auditRunId,
            periodFrom,
            periodTo,
            30,
        );

        expect(stockoutDetectMock).not.toHaveBeenCalled();
        expect(result).toHaveLength(0);
    });
});
