/** Имена очередей (namespace) */
export const QUEUE_NAMES = {
    EXAMPLE: 'app-example',
    OZON_SYNC: 'ozon-sync',
    OZON_AUDIT: 'ozon-audit',
    OZON_COMPETITOR: 'ozon-competitor',
    OZON_ALERTS: 'ozon-alerts',
} as const;

/** Все Ozon-очереди для admin/monitoring */
export const OZON_QUEUE_NAMES = [
    QUEUE_NAMES.OZON_SYNC,
    QUEUE_NAMES.OZON_AUDIT,
    QUEUE_NAMES.OZON_COMPETITOR,
    QUEUE_NAMES.OZON_ALERTS,
] as const;

/** Имена job-типов внутри очереди */
export const QUEUE_JOB_NAMES = {
    EXAMPLE_TASK: 'example-task',
    SYNC_OZON_PRODUCTS: 'syncOzonProducts',
    SYNC_OZON_PRICES: 'syncOzonPrices',
    SYNC_OZON_STOCKS: 'syncOzonStocks',
    SYNC_OZON_ORDERS: 'syncOzonOrders',
    SYNC_OZON_SALES_REPORTS: 'syncOzonSalesReports',
    SYNC_OZON_FINANCE_REPORTS: 'syncOzonFinanceReports',
    SYNC_COMPETITOR_OFFICIAL_STATS: 'syncCompetitorProductOfficialStats',
    SYNC_OZON_FULL: 'syncOzonFull',
    OZON_INITIAL_SYNC: 'ozonInitialSync',
    OZON_PRODUCTS_SYNC: 'ozonProductsSync',
    OZON_STOCKS_SYNC: 'ozonStocksSync',
    OZON_PRICES_SYNC: 'ozonPricesSync',
    OZON_SALES_SYNC: 'ozonSalesSync',
    OZON_FINANCE_SYNC: 'ozonFinanceSync',
    OZON_ADS_SYNC: 'ozonAdsSync',
    OZON_METRICS_BUILD: 'ozonMetricsBuild',
    OZON_ISSUES_DETECT: 'ozonIssuesDetect',
    OZON_RECOMMENDATIONS_BUILD: 'ozonRecommendationsBuild',
    OZON_AI_REPORT_GENERATE: 'ozonAiReportGenerate',
    OZON_COMPETITORS_SYNC: 'ozonCompetitorsSync',
    OZON_AUDIT_PIPELINE: 'ozonAuditPipeline',
    OZON_AUDIT_STEP: 'ozonAuditStep',
    DISPATCH_ALERT: 'dispatchAlert',
} as const;

/** Дефолтные опции job: attempts, backoff, retention */
export const DEFAULT_QUEUE_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
};

/** Таймаут worker sync-очереди (lockDuration), мс */
export const OZON_SYNC_QUEUE_LOCK_MS = 300_000;

/** Таймаут worker audit-очереди (lockDuration), мс */
export const OZON_AUDIT_QUEUE_LOCK_MS = 900_000;

/** Таймаут worker competitor-очереди (lockDuration), мс */
export const OZON_COMPETITOR_QUEUE_LOCK_MS = 300_000;

/** Таймаут worker alerts-очереди (lockDuration), мс */
export const OZON_ALERTS_QUEUE_LOCK_MS = 120_000;

/** @deprecated используйте OZON_*_QUEUE_LOCK_MS */
export const DEFAULT_QUEUE_WORKER_LOCK_MS = OZON_SYNC_QUEUE_LOCK_MS;

/** Размер batch для metrics builder */
export const OZON_METRICS_BATCH_SIZE = 200;

/** Размер batch для sync prices/stocks */
export const OZON_SYNC_PRODUCTS_BATCH_SIZE = 100;

/** TTL cron lock, мс */
export const OZON_CRON_LOCK_TTL_MS = 600_000;
