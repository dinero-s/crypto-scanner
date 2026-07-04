/** Имена очередей (namespace) */
export const QUEUE_NAMES = {
    EXAMPLE: 'app-example',
    SCANNER_MARKET_DATA: 'scanner-market-data',
    SCANNER_ARBITRAGE: 'scanner-arbitrage',
    SCANNER_ALERTS: 'scanner-alerts',
} as const;

/** Имена job-типов внутри очереди */
export const QUEUE_JOB_NAMES = {
    EXAMPLE_TASK: 'example-task',
    SCANNER_MARKET_DATA_COLLECT: 'scanner-market-data-collect',
    SCANNER_ARBITRAGE_CALCULATE: 'scanner-arbitrage-calculate',
    SCANNER_ALERT_DISPATCH: 'scanner-alert-dispatch',
    SCANNER_ALERT_EVALUATE: 'scanner-alert-evaluate',
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

/** Таймаут worker по умолчанию (lockDuration), мс */
export const DEFAULT_QUEUE_WORKER_LOCK_MS = 60_000;
