/** Статус подключения Ozon */
export enum OzonConnectionStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    INVALID = 'invalid',
    REVOKED = 'revoked',
    ERROR = 'error',
}

/** Статус товара конкурента */
export enum CompetitorProductStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    UNAVAILABLE = 'unavailable',
    ERROR = 'error',
    DATA_NOT_AVAILABLE = 'data_not_available_via_official_api',
}

/** Маркетплейс карточки конкурента */
export enum CompetitorMarketplace {
    OZON = 'OZON',
}

/** Тип рекомендации */
export enum RecommendationType {
    PRICE_ADJUSTMENT = 'price_adjustment',
    AD_BUDGET_CHANGE = 'ad_budget_change',
    STOCK_REPLENISHMENT = 'stock_replenishment',
    ASSORTMENT_OPPORTUNITY = 'assortment_opportunity',
    RATING_RISK = 'rating_risk',
    COMPETITOR_PRICE_DROP = 'competitor_price_drop',
    SALES_DROP = 'sales_drop',
    MARGIN_RISK = 'margin_risk',
}

/** Серьёзность рекомендации/алерта */
export enum OzonSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

/** Статус рекомендации */
export enum RecommendationStatus {
    OPEN = 'open',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
}

/** Статус алерта */
export enum AlertEventStatus {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
    SKIPPED = 'skipped',
}

/** Тип алерта */
export enum AlertEventType {
    COMPETITOR_PRICE_DROP = 'competitor_price_drop',
    COMPETITOR_PRICE_RISE = 'competitor_price_rise',
    COMPETITOR_OUT_OF_STOCK = 'competitor_out_of_stock',
    SELLER_OUT_OF_STOCK_RISK = 'seller_out_of_stock_risk',
    AD_INEFFECTIVE = 'ad_ineffective',
    RATING_DROP = 'rating_drop',
    SALES_DROP = 'sales_drop',
    AI_RECOMMENDATION = 'ai_recommendation',
    INITIAL_AUDIT_COMPLETED = 'initial_audit_completed',
    DAILY_CEO_REPORT = 'daily_ceo_report',
}

/** Источник API для снимка метрик */
export enum OzonMetricsSourceApi {
    SELLER_API = 'seller_api',
    PERFORMANCE_API = 'performance_api',
    STATISTICS_API = 'statistics_api',
}

/** Тип официального Ozon API */
export enum OzonApiType {
    SELLER = 'seller',
    PERFORMANCE = 'performance',
    STATISTICS = 'statistics',
}

/** Тип обнаруженной проблемы (Profit Audit) */
export enum OzonDetectedIssueType {
    STOCKOUT_RISK = 'STOCKOUT_RISK',
    OVERSTOCK = 'OVERSTOCK',
    ADS_WASTE = 'ADS_WASTE',
    PRICE_LEAK = 'PRICE_LEAK',
    RETURN_SPIKE = 'RETURN_SPIKE',
}

/** Серьёзность Profit Audit (uppercase для API-контракта) */
export enum OzonAuditSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

/** Статус обнаруженной проблемы */
export enum OzonDetectedIssueStatus {
    NEW = 'NEW',
    VIEWED = 'VIEWED',
    FIXED = 'FIXED',
    IGNORED = 'IGNORED',
}

/** Тип действия рекомендации Profit Audit */
export enum OzonAuditActionType {
    CHECK_STOCK = 'CHECK_STOCK',
    REDUCE_AD_SPEND = 'REDUCE_AD_SPEND',
    CHECK_PRICE = 'CHECK_PRICE',
    CHECK_RETURNS = 'CHECK_RETURNS',
    CLEAR_OVERSTOCK = 'CLEAR_OVERSTOCK',
}

/** Статус рекомендации Profit Audit */
export enum OzonAuditRecommendationStatus {
    NEW = 'NEW',
    VIEWED = 'VIEWED',
    DONE = 'DONE',
    IGNORED = 'IGNORED',
}

/** Тип AI-отчёта Profit Audit */
export enum OzonAiReportType {
    INITIAL_AUDIT = 'INITIAL_AUDIT',
    DAILY_CEO_REPORT = 'DAILY_CEO_REPORT',
}

/** Статус запуска Profit Audit */
export enum OzonAuditRunStatus {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    PARTIAL_DATA = 'PARTIAL_DATA',
}

/** Шаг прогресса Profit Audit pipeline */
export enum OzonAuditRunProgressStep {
    QUEUED = 'QUEUED',
    SYNC = 'SYNC',
    METRICS_BUILD = 'METRICS_BUILD',
    DATA_QUALITY = 'DATA_QUALITY',
    ISSUES_DETECT = 'ISSUES_DETECT',
    RECOMMENDATIONS_BUILD = 'RECOMMENDATIONS_BUILD',
    AI_REPORT = 'AI_REPORT',
    DONE = 'DONE',
    FAILED = 'FAILED',
}

/** Состояние качества данных Profit Audit */
export enum OzonAuditDataQualityState {
    READY = 'READY',
    PARTIAL_DATA = 'PARTIAL_DATA',
    INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

/** Уверенность расчёта потерь */
export enum OzonLossCalculationConfidence {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

/** Доступность детектора для Profit Audit */
export enum OzonDetectorAvailabilityStatus {
    READY = 'READY',
    PARTIAL = 'PARTIAL',
    NOT_AVAILABLE = 'NOT_AVAILABLE',
}

/** UI-состояние Profit Audit для frontend */
export enum OzonAuditUiState {
    NO_CONNECTION = 'NO_CONNECTION',
    CONNECTED_NOT_AUDITED = 'CONNECTED_NOT_AUDITED',
    AUDIT_RUNNING = 'AUDIT_RUNNING',
    AUDIT_READY = 'AUDIT_READY',
    AUDIT_FAILED = 'AUDIT_FAILED',
    PARTIAL_DATA = 'PARTIAL_DATA',
}

/** Действие аудита подключения Ozon */
export enum OzonConnectionAuditAction {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    HEALTH_CHECK = 'health_check',
    SYNC_TRIGGERED = 'sync_triggered',
    SYNC_COMPLETED = 'sync_completed',
    SYNC_FAILED = 'sync_failed',
    AUDIT_TRIGGERED = 'audit_triggered',
    AUDIT_COMPLETED = 'audit_completed',
    COMPETITOR_ADDED = 'competitor_added',
    COMPETITOR_SYNC_TRIGGERED = 'competitor_sync_triggered',
}

/** Статус аудита подключения */
export enum OzonConnectionAuditStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
}

/** События compliance-лога */
export enum ComplianceLogEvent {
    BLOCKED_FORBIDDEN_ENDPOINT = 'blocked_forbidden_endpoint',
    BLOCKED_HTML_SCRAPING_ATTEMPT = 'blocked_html_scraping_attempt',
    BLOCKED_UNSUPPORTED_DATA_REQUEST = 'blocked_unsupported_data_request',
    RATE_LIMIT_BACKOFF = 'rate_limit_backoff',
    DATA_NOT_AVAILABLE = 'data_not_available_via_official_api',
}
