import { OzonAuditSeverity } from '../../constants/ozon.enums';
import { RecommendationContext } from '../interfaces/audit-ai.interfaces';

const SEVERITY_ORDER: Record<string, number> = {
    [OzonAuditSeverity.CRITICAL]: 0,
    [OzonAuditSeverity.HIGH]: 1,
    [OzonAuditSeverity.MEDIUM]: 2,
    [OzonAuditSeverity.LOW]: 3,
};

/** Грубая оценка токенов (≈4 символа на токен) */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/** Сортировка issues по severity */
export function sortIssuesBySeverity<T extends { severity: string }>(
    issues: T[],
): T[] {
    return [...issues].sort(
        (a, b) =>
            (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4),
    );
}

/** Top-N issues с усечённым evidence для LLM */
export function compressIssuesForLlm(
    issues: RecommendationContext['issues'],
    maxIssues: number,
    maxEvidenceItems: number,
    maxEvidenceDescriptionLength: number,
): RecommendationContext['issues'] {
    return sortIssuesBySeverity(issues)
        .slice(0, maxIssues)
        .map((issue) => ({
            ...issue,
            evidence: issue.evidence.slice(0, maxEvidenceItems).map((item) => ({
                ...item,
                description: item.description
                    ? item.description.slice(0, maxEvidenceDescriptionLength)
                    : item.description,
            })),
        }));
}

/** Сжатие контекста до лимита токенов */
export function compressContextForLlm(
    context: RecommendationContext,
    maxInputTokens: number,
    maxIssues: number,
): RecommendationContext {
    let issues = compressIssuesForLlm(context.issues, maxIssues, 3, 200);
    let compressed: RecommendationContext = { ...context, issues };

    while (
        issues.length > 1 &&
        estimateTokens(JSON.stringify(compressed)) > maxInputTokens
    ) {
        issues = issues.slice(0, -1);
        compressed = { ...context, issues };
    }

    return compressed;
}
