import { OzonDetectedIssueType } from '../../constants/ozon.enums';

/** Ключ проблемы для дедупликации */
export function buildIssueKey(
    userId: string,
    integrationId: string,
    offerId: string | undefined,
    productId: string | undefined,
    type: OzonDetectedIssueType,
): string {
    const productRef = offerId ?? productId ?? 'store';
    return `${userId}:${integrationId}:${productRef}:${type}`;
}

/** Ключ рекомендации для дедупликации */
export function buildRecommendationKey(
    userId: string,
    integrationId: string,
    offerId: string | undefined,
    productId: string | undefined,
    issueType: OzonDetectedIssueType,
): string {
    return buildIssueKey(userId, integrationId, offerId, productId, issueType);
}
