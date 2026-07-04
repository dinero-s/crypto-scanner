/** TTL snapshots и AI-отчётов по умолчанию, дней */
export const DEFAULT_OZON_SNAPSHOT_TTL_DAYS = 365;
export const DEFAULT_OZON_AI_REPORT_TTL_DAYS = 365;

/** Секунды для MongoDB expireAfterSeconds */
export function daysToExpireAfterSeconds(days: number): number {
    return days * 24 * 60 * 60;
}
