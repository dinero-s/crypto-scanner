import { OzonAiAdvisorService } from './ozon-ai-advisor.service';
import { RecommendationContext } from '../interfaces/audit-ai.interfaces';

describe('OzonAiAdvisorService deterministic report with data quality', () => {
    const llmProvider = { isEnabled: () => false };
    const httpService = {};
    const configService = { get: () => undefined };

    const service = new OzonAiAdvisorService(
        llmProvider as never,
        httpService as never,
        configService as never,
    );

    const baseDataQuality = {
        score: 90,
        state: 'READY',
        missingData: [] as Array<{ type: string; title: string; impact: string }>,
        warnings: [] as string[],
        detectorAvailability: {
            stockoutRisk: { status: 'READY' },
            overstock: { status: 'READY' },
            adsWaste: { status: 'READY' },
            priceLeak: { status: 'READY' },
            returnSpike: { status: 'READY' },
        },
        checkedDetectorsCount: 5,
        availableDetectorsCount: 5,
        partialDetectorsCount: 0,
        unavailableDetectorsCount: 0,
    };

    const baseContext: RecommendationContext = {
        reportType: 'INITIAL_AUDIT',
        auditRun: {
            id: 'audit-run-1',
            periodFrom: '2026-01-01T00:00:00.000Z',
            periodTo: '2026-01-31T00:00:00.000Z',
            periodDays: 30,
            status: 'SUCCESS',
        },
        period: { from: '2026-01-01', to: '2026-01-31' },
        summary: {
            totalIssues: 2,
            criticalIssues: 1,
            highIssues: 0,
            estimatedLossMin: 5000,
            estimatedLossMax: 10000,
        },
        dataQuality: baseDataQuality,
        issues: [
            {
                type: 'STOCKOUT_RISK',
                severity: 'CRITICAL',
                confidence: 0.9,
                title: 'Риск OOS',
                summary: 'Остаток на 3 дня',
                estimatedLossMin: 5000,
                estimatedLossMax: 10000,
                evidence: [],
                recommendation: { title: 'Пополнить', steps: ['Шаг 1'] },
            },
        ],
    };

    it('добавляет disclaimer при низком dataQuality.score', () => {
        const context: RecommendationContext = {
            ...baseContext,
            dataQuality: {
                ...baseDataQuality,
                score: 55,
                state: 'PARTIAL_DATA',
                missingData: [
                    {
                        type: 'ADS',
                        title: 'Нет рекламных данных',
                        impact: 'Рекламные рекомендации недоступны.',
                    },
                ],
                warnings: ['Аудит выполнен частично: рекламные рекомендации недоступны.'],
                unavailableDetectorsCount: 1,
            },
        };

        const report = service.buildDeterministicReport(context);

        expect(report.executiveSummary).toContain('55/100');
        expect(report.executiveSummary).toContain('PARTIAL_DATA');
    });

    it('не добавляет disclaimer при state READY', () => {
        const report = service.buildDeterministicReport(baseContext);

        expect(report.executiveSummary).not.toContain('PARTIAL_DATA');
        expect(report.executiveSummary).toContain('5000');
    });
});
