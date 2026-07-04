import {
    OzonAuditActionType,
    OzonAuditSeverity,
    OzonDetectedIssueType,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';

/** Доказательство проблемы для детектора и AI-контекста */
export interface IssueEvidence {
    metric: string;
    value: number | string | boolean | null;
    threshold?: number | string | null;
    period?: string;
    description?: string;
}

/** Черновик обнаруженной проблемы (до сохранения в MongoDB) */
export interface DetectedIssueDraft {
    userId: string;
    integrationId: string;
    productId?: string;
    offerId?: string;
    sku?: string;
    type: OzonDetectedIssueType;
    severity: OzonAuditSeverity;
    confidence: number;
    estimatedLossMin?: number;
    estimatedLossMax?: number;
    lossCalculationConfidence: OzonLossCalculationConfidence;
    lossExplanation?: string;
    title: string;
    summary: string;
    evidence: IssueEvidence[];
}

/** Рекомендация, построенная из проблемы */
export interface BuiltRecommendation {
    priority: number;
    actionType: OzonAuditActionType;
    title: string;
    description: string;
    steps: string[];
    expectedEffectMin?: number;
    expectedEffectMax?: number;
    confidence: number;
}

/** Снимок метрик для детекторов (in-memory) */
export interface MetricSnapshotView {
    userId: string;
    integrationId: string;
    productId: string;
    offerId?: string;
    sku?: string;
    date: Date;
    revenue?: number;
    ordersCount?: number;
    unitsSold?: number;
    stockAvailable?: number;
    stockDaysLeft?: number;
    price?: number;
    oldPrice?: number;
    discountPercent?: number;
    adSpend?: number;
    adOrders?: number;
    drr?: number;
    acos?: number;
    returnsCount?: number;
    returnsRate?: number;
    grossProfitEstimate?: number;
    marginPercent?: number;
    views?: number;
    clicks?: number;
    ctr?: number;
    conversionRate?: number;
}
