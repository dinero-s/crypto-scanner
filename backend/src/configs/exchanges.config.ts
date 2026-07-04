import { registerAs } from '@nestjs/config';

/** Публичные REST URL бирж (без ключей) */
export default registerAs(
    'exchanges',
    (): Record<string, unknown> => ({
        binanceRestUrl: process.env.BINANCE_REST_URL ?? 'https://api.binance.com',
        binanceFuturesUrl: process.env.BINANCE_FUTURES_URL ?? 'https://fapi.binance.com',
        bybitRestUrl: process.env.BYBIT_REST_URL ?? 'https://api.bybit.com',
        okxRestUrl: process.env.OKX_REST_URL ?? 'https://www.okx.com',
        gateRestUrl: process.env.GATE_REST_URL ?? 'https://api.gateio.ws',
        kucoinRestUrl: process.env.KUCOIN_REST_URL ?? 'https://api.kucoin.com',
        kucoinFuturesUrl:
            process.env.KUCOIN_FUTURES_URL ?? 'https://api-futures.kucoin.com',
        krakenRestUrl: process.env.KRAKEN_REST_URL ?? 'https://api.kraken.com',
        krakenFuturesUrl:
            process.env.KRAKEN_FUTURES_URL ?? 'https://futures.kraken.com',
        requestTimeoutMs: process.env.EXCHANGE_REQUEST_TIMEOUT_MS
            ? Number.parseInt(process.env.EXCHANGE_REQUEST_TIMEOUT_MS, 10)
            : 10_000,
        retryMaxAttempts: process.env.EXCHANGE_RETRY_MAX_ATTEMPTS
            ? Number.parseInt(process.env.EXCHANGE_RETRY_MAX_ATTEMPTS, 10)
            : 3,
        retryDelayMs: process.env.EXCHANGE_RETRY_DELAY_MS
            ? Number.parseInt(process.env.EXCHANGE_RETRY_DELAY_MS, 10)
            : 500,
        rateLimitIntervalMs: process.env.EXCHANGE_RATE_LIMIT_INTERVAL_MS
            ? Number.parseInt(process.env.EXCHANGE_RATE_LIMIT_INTERVAL_MS, 10)
            : 100,
    }),
);
