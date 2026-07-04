/** Контекст для AI Profit Audit */
export interface RecommendationContext {
    reportType: 'INITIAL_AUDIT' | 'DAILY_CEO_REPORT';
    auditRun: {
        id: string;
        periodFrom: string;
        periodTo: string;
        periodDays: number;
        status: string;
    };
    period: {
        from: string;
        to: string;
    };
    summary: {
        totalIssues: number;
        criticalIssues: number;
        highIssues: number;
        estimatedLossMin: number;
        estimatedLossMax: number;
        lossCalculationConfidence?: string;
    };
    dataQuality: {
        score: number;
        state: string;
        missingData: Array<{
            type: string;
            title: string;
            impact: string;
        }>;
        warnings: string[];
        detectorAvailability: Record<
            string,
            { status: string; reason?: string }
        >;
        checkedDetectorsCount: number;
        availableDetectorsCount: number;
        partialDetectorsCount: number;
        unavailableDetectorsCount: number;
    };
    issues: Array<{
        type: string;
        severity: string;
        confidence: number;
        title: string;
        summary: string;
        estimatedLossMin?: number;
        estimatedLossMax?: number;
        lossCalculationConfidence?: string;
        lossExplanation?: string;
        evidence: Array<{
            metric: string;
            value: number | string | boolean | null;
            threshold?: number | string | null;
            period?: string;
            description?: string;
        }>;
        recommendation: {
            title: string;
            steps: string[];
        };
    }>;
}

/** Ответ AI-советника */
export interface AiAdvisorReport {
    title: string;
    executiveSummary: string;
    topActions: Array<{
        title: string;
        reason: string;
        steps: string[];
    }>;
    risks: string[];
}

/** Deterministic fallback-отчёт */
export interface DeterministicAuditReport {
    title: string;
    executiveSummary: string;
    topActions: Array<{
        title: string;
        reason: string;
        steps: string[];
    }>;
    risks: string[];
    summary: RecommendationContext['summary'];
}
