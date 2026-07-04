import { registerAs } from '@nestjs/config';

export default registerAs(
    'scanner',
    (): Record<string, unknown> => ({
        jobsEnabled: process.env.SCANNER_JOBS_ENABLED !== 'false',
        defaultSymbols: (process.env.SCANNER_DEFAULT_SYMBOLS ?? 'BTC/USDT,ETH/USDT').split(','),
        marketDataCacheTtlSec: process.env.SCANNER_MARKET_DATA_CACHE_TTL_SEC
            ? Number.parseInt(process.env.SCANNER_MARKET_DATA_CACHE_TTL_SEC, 10)
            : 60,
        defaultSpotFeeRate: process.env.SCANNER_DEFAULT_SPOT_FEE_RATE
            ? Number.parseFloat(process.env.SCANNER_DEFAULT_SPOT_FEE_RATE)
            : 0.001,
        defaultFuturesFeeRate: process.env.SCANNER_DEFAULT_FUTURES_FEE_RATE
            ? Number.parseFloat(process.env.SCANNER_DEFAULT_FUTURES_FEE_RATE)
            : 0.0005,
        defaultSlippage: process.env.SCANNER_DEFAULT_SLIPPAGE
            ? Number.parseFloat(process.env.SCANNER_DEFAULT_SLIPPAGE)
            : 0.0005,
    }),
);
