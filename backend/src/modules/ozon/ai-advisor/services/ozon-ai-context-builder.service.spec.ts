import { OzonAiContextBuilderService } from './ozon-ai-context-builder.service';
import {
    OzonAiReportType,
    OzonAuditDataQualityState,
    OzonAuditRecommendationStatus,
    OzonAuditRunStatus,
    OzonAuditSeverity,
    OzonDetectedIssueStatus,
    OzonDetectedIssueType,
    OzonDetectorAvailabilityStatus,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';
import { Types } from 'mongoose';
import { OzonDetectedIssueDoc } from '../../analytics/entities/ozon-detected-issue.entity';
import { OzonAuditRecommendationDoc } from '../../analytics/entities/ozon-audit-recommendation.entity';
import { OzonAuditDataQuality } from '../../analytics/interfaces/data-quality.interfaces';
import { OzonAuditRunDoc } from '../../analytics/entities/ozon-audit-run.entity';
import { OzonAuditRunService } from '../../analytics/services/ozon-audit-run.service';

const detectorAvailability = {
    stockoutRisk: { status: OzonDetectorAvailabilityStatus.READY },
    overstock: { status: OzonDetectorAvailabilityStatus.READY },
    adsWaste: { status: OzonDetectorAvailabilityStatus.READY },
    priceLeak: { status: OzonDetectorAvailabilityStatus.READY },
    returnSpike: { status: OzonDetectorAvailabilityStatus.READY },
};

describe('OzonAiContextBuilderService', () => {
    const issueId = new Types.ObjectId();
    const auditRunId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const integrationId = new Types.ObjectId();

    const fullDataQuality: OzonAuditDataQuality = {
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
        detectorAvailability,
        checkedDetectorsCount: 5,
        availableDetectorsCount: 5,
        partialDetectorsCount: 0,
        unavailableDetectorsCount: 0,
    };

    const partialDataQuality: OzonAuditDataQuality = {
        score: 55,
        state: OzonAuditDataQualityState.PARTIAL_DATA,
        hasProductsData: true,
        hasPriceData: true,
        hasStockData: true,
        hasSalesData: true,
        hasFinanceData: false,
        hasAdsData: false,
        hasReturnsData: false,
        missingData: [
            {
                type: 'ADS',
                title: 'Нет рекламных данных',
                description: 'Performance API не вернул данные.',
                impact: 'Рекламные рекомендации недоступны.',
            },
        ],
        warnings: ['Аудит выполнен частично: недоступны нет рекламных данных.'],
        detectorAvailability: {
            ...detectorAvailability,
            adsWaste: {
                status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE,
                reason: 'NO_ADS_DATA',
            },
        },
        checkedDetectorsCount: 5,
        availableDetectorsCount: 4,
        partialDetectorsCount: 0,
        unavailableDetectorsCount: 1,
    };

    const auditRun = {
        _id: auditRunId,
        periodDays: 30,
        status: OzonAuditRunStatus.SUCCESS,
    } as OzonAuditRunDoc;

    const issues: OzonDetectedIssueDoc[] = [
        {
            _id: issueId,
            userId,
            integrationId,
            type: OzonDetectedIssueType.STOCKOUT_RISK,
            severity: OzonAuditSeverity.CRITICAL,
            confidence: 0.9,
            title: 'Риск OOS',
            summary: 'Остаток на 3 дня',
            evidence: [{ metric: 'stockDaysLeft', value: 3 }],
            estimatedLossMin: 1000,
            estimatedLossMax: 5000,
            lossCalculationConfidence: OzonLossCalculationConfidence.HIGH,
            status: OzonDetectedIssueStatus.NEW,
            detectedAt: new Date(),
            issueKey: `${userId.toString()}:${integrationId.toString()}:sku1:STOCKOUT_RISK`,
        } as OzonDetectedIssueDoc,
    ];

    const recommendations: OzonAuditRecommendationDoc[] = [
        {
            issueId,
            title: 'Пополнить остатки',
            steps: ['Шаг 1', 'Шаг 2'],
            status: OzonAuditRecommendationStatus.NEW,
        } as OzonAuditRecommendationDoc,
    ];

    const issueModel = {
        find: () => ({
            sort: () => ({
                limit: () => ({
                    exec: async () => issues,
                }),
            }),
        }),
    };

    const recommendationModel = {
        find: () => ({
            exec: async () => recommendations,
        }),
    };

    const auditRunService = {
        calculateAggregateLossConfidence: () => OzonLossCalculationConfidence.HIGH,
    } as Pick<OzonAuditRunService, 'calculateAggregateLossConfidence'>;

    const configService = {
        get: (key: string) => {
            if (key === 'ozon.audit.llmMaxIssues') {
                return 15;
            }
            return undefined;
        },
    };

    const service = new OzonAiContextBuilderService(
        issueModel as never,
        recommendationModel as never,
        auditRunService as OzonAuditRunService,
        configService as never,
    );

    it('собирает RecommendationContext из фактов', async () => {
        const context = await service.buildContext(
            userId.toString(),
            integrationId.toString(),
            OzonAiReportType.INITIAL_AUDIT,
            new Date('2026-01-01'),
            new Date('2026-01-31'),
            fullDataQuality,
            auditRun,
            issues,
        );

        expect(context.auditRun.id).toBe(auditRunId.toString());
        expect(context.summary.totalIssues).toBe(1);
        expect(context.summary.criticalIssues).toBe(1);
        expect(context.summary.estimatedLossMin).toBe(1000);
        expect(context.issues[0].recommendation.steps).toEqual(['Шаг 1', 'Шаг 2']);
        expect(context.dataQuality.score).toBe(90);
        expect(context.dataQuality.detectorAvailability).toBeDefined();
    });

    it('включает dataQuality при неполных данных', async () => {
        const context = await service.buildContext(
            userId.toString(),
            integrationId.toString(),
            OzonAiReportType.INITIAL_AUDIT,
            new Date('2026-01-01'),
            new Date('2026-01-31'),
            partialDataQuality,
            auditRun,
            issues,
        );

        expect(context.dataQuality.score).toBe(55);
        expect(context.dataQuality.state).toBe(OzonAuditDataQualityState.PARTIAL_DATA);
        expect(context.dataQuality.missingData).toHaveLength(1);
        expect(context.dataQuality.warnings.length).toBeGreaterThan(0);
        expect(context.dataQuality.unavailableDetectorsCount).toBe(1);
    });

    it('не включает сырые секреты и credentials в context', async () => {
        const context = await service.buildContext(
            userId.toString(),
            integrationId.toString(),
            OzonAiReportType.INITIAL_AUDIT,
            new Date('2026-01-01'),
            new Date('2026-01-31'),
            fullDataQuality,
            auditRun,
            issues,
        );

        const serialized = JSON.stringify(context);

        expect(serialized).not.toMatch(/apiKey/i);
        expect(serialized).not.toMatch(/clientSecret/i);
        expect(serialized).not.toMatch(/clientId/i);
        expect(serialized).not.toMatch(/password/i);
        expect(serialized).not.toMatch(/credential/i);
        expect(serialized).not.toMatch(/accessToken/i);
        expect(context.auditRun.id).toBe(auditRunId.toString());
        expect(context.dataQuality.detectorAvailability).toBeDefined();
    });
});
