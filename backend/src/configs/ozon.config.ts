import { registerAs } from '@nestjs/config';

/** Конфигурация Ozon-модуля (только официальные API) */
export default registerAs(
    'ozon',
    (): Record<string, unknown> => ({
        encryption: {
            key: process.env.OZON_ENCRYPTION_KEY ?? '',
            iv: process.env.OZON_ENCRYPTION_IV ?? '',
        },
        api: {
            sellerBaseUrl:
                process.env.OZON_SELLER_API_BASE_URL ??
                'https://api-seller.ozon.ru',
            performanceBaseUrl:
                process.env.OZON_PERFORMANCE_API_BASE_URL ??
                'https://api-performance.ozon.ru',
            statisticsBaseUrl:
                process.env.OZON_STATISTICS_API_BASE_URL ??
                'https://api-seller.ozon.ru',
            requestTimeoutMs: process.env.OZON_API_TIMEOUT_MS
                ? Number.parseInt(process.env.OZON_API_TIMEOUT_MS, 10)
                : 30_000,
            maxRetries: process.env.OZON_API_MAX_RETRIES
                ? Number.parseInt(process.env.OZON_API_MAX_RETRIES, 10)
                : 3,
            minRequestIntervalMs: process.env.OZON_API_MIN_REQUEST_INTERVAL_MS
                ? Number.parseInt(process.env.OZON_API_MIN_REQUEST_INTERVAL_MS, 10)
                : 250,
        },
        ai: {
            enabled: process.env.OZON_AI_ADVISOR_ENABLED === 'true',
            provider: process.env.OZON_AI_PROVIDER ?? 'rule-based',
            apiKey: process.env.OZON_OPENAI_API_KEY ?? '',
            baseUrl: process.env.OZON_OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
            model: process.env.OZON_OPENAI_MODEL ?? 'gpt-4o-mini',
        },
        alerts: {
            telegramBotToken: process.env.OZON_TELEGRAM_BOT_TOKEN ?? '',
            telegramEnabled: process.env.OZON_TELEGRAM_ALERTS_ENABLED === 'true',
            emailEnabled: process.env.OZON_EMAIL_ALERTS_ENABLED === 'true',
        },
        sync: {
            concurrency: process.env.OZON_SYNC_CONCURRENCY
                ? Number.parseInt(process.env.OZON_SYNC_CONCURRENCY, 10)
                : 2,
            autoSyncEnabled: process.env.AUTO_SYNC_ENABLED !== 'false',
        },
        audit: {
            minAdSpendForIssue: process.env.OZON_AUDIT_MIN_AD_SPEND
                ? Number.parseFloat(process.env.OZON_AUDIT_MIN_AD_SPEND)
                : 500,
            maxAllowedDrr: process.env.OZON_AUDIT_MAX_DRR
                ? Number.parseFloat(process.env.OZON_AUDIT_MAX_DRR)
                : 0.25,
            minAdOrders: process.env.OZON_AUDIT_MIN_AD_ORDERS
                ? Number.parseInt(process.env.OZON_AUDIT_MIN_AD_ORDERS, 10)
                : 1,
            minReturnsCount: process.env.OZON_AUDIT_MIN_RETURNS
                ? Number.parseInt(process.env.OZON_AUDIT_MIN_RETURNS, 10)
                : 3,
            priceDropPercentThreshold: process.env.OZON_AUDIT_PRICE_DROP_PCT
                ? Number.parseFloat(process.env.OZON_AUDIT_PRICE_DROP_PCT)
                : 0.05,
            overstockDaysThreshold: process.env.OZON_AUDIT_OVERSTOCK_DAYS
                ? Number.parseInt(process.env.OZON_AUDIT_OVERSTOCK_DAYS, 10)
                : 120,
            stockoutDaysThreshold: process.env.OZON_AUDIT_STOCKOUT_DAYS
                ? Number.parseInt(process.env.OZON_AUDIT_STOCKOUT_DAYS, 10)
                : 14,
            aiPromptVersion: process.env.OZON_AUDIT_AI_PROMPT_VERSION ?? '1.0',
            metricsBatchSize: process.env.OZON_METRICS_BATCH_SIZE
                ? Number.parseInt(process.env.OZON_METRICS_BATCH_SIZE, 10)
                : 200,
            snapshotTtlDays: process.env.OZON_SNAPSHOT_TTL_DAYS
                ? Number.parseInt(process.env.OZON_SNAPSHOT_TTL_DAYS, 10)
                : 365,
            aiReportTtlDays: process.env.OZON_AI_REPORT_TTL_DAYS
                ? Number.parseInt(process.env.OZON_AI_REPORT_TTL_DAYS, 10)
                : 365,
            llmMaxInputTokens: process.env.OZON_LLM_MAX_INPUT_TOKENS
                ? Number.parseInt(process.env.OZON_LLM_MAX_INPUT_TOKENS, 10)
                : 24_000,
            llmMaxIssues: process.env.OZON_LLM_MAX_ISSUES
                ? Number.parseInt(process.env.OZON_LLM_MAX_ISSUES, 10)
                : 15,
            dailyAuditSkipSyncHours: process.env.OZON_DAILY_AUDIT_SKIP_SYNC_HOURS
                ? Number.parseInt(process.env.OZON_DAILY_AUDIT_SKIP_SYNC_HOURS, 10)
                : 6,
        },
        features: {
            ozonOperatorEnabled: process.env.OZON_OPERATOR_ENABLED !== 'false',
            wbOperatorEnabled: process.env.WB_OPERATOR_ENABLED === 'true',
            llmAdvisorEnabled: process.env.LLM_ADVISOR_ENABLED === 'true' ||
                process.env.OZON_AI_ADVISOR_ENABLED === 'true',
            telegramAlertsEnabled: process.env.TELEGRAM_ALERTS_ENABLED === 'true' ||
                process.env.OZON_TELEGRAM_ALERTS_ENABLED === 'true',
            emailAlertsEnabled: process.env.EMAIL_ALERTS_ENABLED === 'true' ||
                process.env.OZON_EMAIL_ALERTS_ENABLED === 'true',
            autoSyncEnabled: process.env.AUTO_SYNC_ENABLED !== 'false',
            competitorTrackingEnabled:
                process.env.COMPETITOR_TRACKING_ENABLED !== 'false',
        },
    }),
);
