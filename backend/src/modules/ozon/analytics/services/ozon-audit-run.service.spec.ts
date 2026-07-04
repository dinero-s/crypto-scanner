import { Types } from 'mongoose';
import { OzonAuditRunService } from './ozon-audit-run.service';
import {
    OzonAuditDataQualityState,
    OzonAuditRunProgressStep,
    OzonAuditRunStatus,
    OzonAuditSeverity,
    OzonDetectedIssueType,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';
import { OzonAuditRunDoc } from '../entities/ozon-audit-run.entity';
import { OzonDetectedIssueDoc } from '../entities/ozon-detected-issue.entity';
import { OzonAuditDataQuality } from '../interfaces/data-quality.interfaces';

describe('OzonAuditRunService', () => {
    const userId = new Types.ObjectId().toString();
    const integrationId = new Types.ObjectId().toString();

    let updateOneMock: jest.Mock;
    let findOneMock: jest.Mock;
    let createMock: jest.Mock;
    let findByIdMock: jest.Mock;
    let service: OzonAuditRunService;

    beforeEach(() => {
        updateOneMock = jest.fn().mockResolvedValue({ modifiedCount: 1 });
        findOneMock = jest.fn();
        createMock = jest.fn();
        findByIdMock = jest.fn();

        const auditRunModel = {
            findOne: findOneMock,
            create: createMock,
            updateOne: updateOneMock,
            findById: findByIdMock,
        };

        service = new OzonAuditRunService(auditRunModel as never);
    });

    it('создаёт auditRun со статусом QUEUED', async () => {
        const auditRunId = new Types.ObjectId();
        createMock.mockResolvedValue({
            _id: auditRunId,
            status: OzonAuditRunStatus.QUEUED,
            progressStep: OzonAuditRunProgressStep.QUEUED,
            periodDays: 30,
        });

        findOneMock.mockReturnValue({ sort: () => ({ exec: async () => null }) });

        const result = await service.startOrReturnActive(userId, integrationId, 30);

        expect(result.isExisting).toBe(false);
        expect(result.status).toBe(OzonAuditRunStatus.QUEUED);
        expect(result.progressStep).toBe(OzonAuditRunProgressStep.QUEUED);
        expect(result.auditRunId).toBe(String(auditRunId));
        expect(createMock).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(integrationId),
                status: OzonAuditRunStatus.QUEUED,
                progressStep: OzonAuditRunProgressStep.QUEUED,
                periodDays: 30,
            }),
        );
    });

    it('не создаёт второй RUNNING audit — возвращает активный', async () => {
        const activeRunId = new Types.ObjectId();
        const activeRun = {
            _id: activeRunId,
            status: OzonAuditRunStatus.RUNNING,
            progressStep: OzonAuditRunProgressStep.SYNC,
        } as OzonAuditRunDoc;

        findOneMock.mockReturnValue({
            sort: () => ({ exec: async () => activeRun }),
        });

        const result = await service.startOrReturnActive(userId, integrationId);

        expect(result.isExisting).toBe(true);
        expect(result.auditRunId).toBe(String(activeRunId));
        expect(result.status).toBe(OzonAuditRunStatus.RUNNING);
        expect(createMock).not.toHaveBeenCalled();
    });

    it('корректно обновляет progressStep', async () => {
        const auditRunId = new Types.ObjectId().toString();

        await service.updateProgressStep(
            auditRunId,
            OzonAuditRunProgressStep.ISSUES_DETECT,
        );

        expect(updateOneMock).toHaveBeenCalledWith(
            { _id: new Types.ObjectId(auditRunId) },
            { progressStep: OzonAuditRunProgressStep.ISSUES_DETECT },
        );
    });

    it('markRunning переводит в RUNNING без смены progressStep', async () => {
        const auditRunId = new Types.ObjectId().toString();

        await service.markRunning(auditRunId);

        expect(updateOneMock).toHaveBeenCalledWith(
            { _id: new Types.ObjectId(auditRunId) },
            expect.objectContaining({
                status: OzonAuditRunStatus.RUNNING,
                startedAt: expect.any(Date),
            }),
        );
        expect(updateOneMock.mock.calls[0]?.[1]).not.toHaveProperty('progressStep');
    });

    it('при race create возвращает уже активный auditRun', async () => {
        const activeRunId = new Types.ObjectId();
        const activeRun = {
            _id: activeRunId,
            status: OzonAuditRunStatus.RUNNING,
            progressStep: OzonAuditRunProgressStep.METRICS_BUILD,
        } as OzonAuditRunDoc;

        findOneMock
            .mockReturnValueOnce({ sort: () => ({ exec: async () => null }) })
            .mockReturnValueOnce({
                sort: () => ({ exec: async () => activeRun }),
            });

        createMock.mockRejectedValue({ code: 11_000 });

        const result = await service.startOrReturnActive(userId, integrationId);

        expect(result.isExisting).toBe(true);
        expect(result.auditRunId).toBe(String(activeRunId));
        expect(result.progressStep).toBe(OzonAuditRunProgressStep.METRICS_BUILD);
    });

    it('finalizeSuccess переводит в SUCCESS при score >= 80', async () => {
        const auditRunId = new Types.ObjectId().toString();
        const dataQuality: OzonAuditDataQuality = {
            score: 85,
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
                stockoutRisk: { status: 'READY' as never },
                overstock: { status: 'READY' as never },
                adsWaste: { status: 'READY' as never },
                priceLeak: { status: 'READY' as never },
                returnSpike: { status: 'READY' as never },
            },
            checkedDetectorsCount: 5,
            availableDetectorsCount: 5,
            partialDetectorsCount: 0,
            unavailableDetectorsCount: 0,
        };

        const issues = [
            {
                severity: OzonAuditSeverity.CRITICAL,
                estimatedLossMin: 1000,
                estimatedLossMax: 2000,
                lossCalculationConfidence: OzonLossCalculationConfidence.HIGH,
            } as OzonDetectedIssueDoc,
        ];

        await service.finalizeSuccess(auditRunId, dataQuality, issues, 1);

        expect(updateOneMock).toHaveBeenCalledWith(
            { _id: new Types.ObjectId(auditRunId) },
            expect.objectContaining({
                status: OzonAuditRunStatus.SUCCESS,
                progressStep: OzonAuditRunProgressStep.DONE,
                dataQualityScore: 85,
                issuesCount: 1,
                criticalIssuesCount: 1,
                recommendationsCount: 1,
                estimatedLossMin: 1000,
                estimatedLossMax: 2000,
            }),
        );
    });

    it('finalizeSuccess переводит в PARTIAL_DATA при score < 80', async () => {
        const auditRunId = new Types.ObjectId().toString();
        const dataQuality: OzonAuditDataQuality = {
            score: 55,
            state: OzonAuditDataQualityState.PARTIAL_DATA,
            hasProductsData: true,
            hasPriceData: true,
            hasStockData: true,
            hasSalesData: true,
            hasFinanceData: false,
            hasAdsData: false,
            hasReturnsData: false,
            missingData: [],
            warnings: [],
            detectorAvailability: {
                stockoutRisk: { status: 'READY' as never },
                overstock: { status: 'READY' as never },
                adsWaste: { status: 'NOT_AVAILABLE' as never, reason: 'NO_ADS_DATA' },
                priceLeak: { status: 'PARTIAL' as never },
                returnSpike: { status: 'NOT_AVAILABLE' as never, reason: 'NO_RETURNS_DATA' },
            },
            checkedDetectorsCount: 5,
            availableDetectorsCount: 2,
            partialDetectorsCount: 1,
            unavailableDetectorsCount: 2,
        };

        await service.finalizeSuccess(auditRunId, dataQuality, [], 0);

        expect(updateOneMock).toHaveBeenCalledWith(
            { _id: new Types.ObjectId(auditRunId) },
            expect.objectContaining({
                status: OzonAuditRunStatus.PARTIAL_DATA,
                progressStep: OzonAuditRunProgressStep.DONE,
                dataQualityScore: 55,
            }),
        );
    });

    it('finalizeFailed переводит в FAILED', async () => {
        const auditRunId = new Types.ObjectId().toString();

        await service.finalizeFailed(auditRunId, 'Ошибка синхронизации', 'AUDIT_PIPELINE_ERROR');

        expect(updateOneMock).toHaveBeenCalledWith(
            { _id: new Types.ObjectId(auditRunId) },
            expect.objectContaining({
                status: OzonAuditRunStatus.FAILED,
                progressStep: OzonAuditRunProgressStep.FAILED,
                errorMessage: 'Ошибка синхронизации',
                errorCode: 'AUDIT_PIPELINE_ERROR',
                finishedAt: expect.any(Date),
            }),
        );
    });

    it('calculateAggregateLossConfidence возвращает LOW без issues', () => {
        expect(service.calculateAggregateLossConfidence([])).toBe(
            OzonLossCalculationConfidence.LOW,
        );
    });

    it('toView сериализует auditRun для UI', () => {
        const now = new Date('2026-01-15T10:00:00.000Z');
        const doc = {
            _id: new Types.ObjectId(),
            status: OzonAuditRunStatus.SUCCESS,
            progressStep: OzonAuditRunProgressStep.DONE,
            periodFrom: new Date('2026-01-01T00:00:00.000Z'),
            periodTo: now,
            periodDays: 30,
            dataQualityScore: 90,
            issuesCount: 3,
        } as OzonAuditRunDoc;

        const view = service.toView(doc);

        expect(view.status).toBe(OzonAuditRunStatus.SUCCESS);
        expect(view.periodDays).toBe(30);
        expect(view.periodFrom).toBe('2026-01-01T00:00:00.000Z');
        expect(view.dataQualityScore).toBe(90);
    });
});
