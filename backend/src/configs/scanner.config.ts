import { registerAs } from '@nestjs/config';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

const parseEnabledExchanges = (): ExchangeEnum[] => {
    const raw = process.env.SCANNER_ENABLED_EXCHANGES;
    if (!raw || raw.trim() === '') {
        return Object.values(ExchangeEnum);
    }
    return raw.split(',').map((e) => e.trim()) as ExchangeEnum[];
};

export default registerAs(
    'scanner',
    (): Record<string, unknown> => ({
        jobsEnabled: process.env.SCANNER_JOBS_ENABLED !== 'false',
        enabledExchanges: parseEnabledExchanges(),
        defaultSymbols: (process.env.SCANNER_DEFAULT_SYMBOLS ?? 'BTC/USDT,ETH/USDT').split(','),
        marketDataCacheTtlSec: process.env.SCANNER_MARKET_DATA_CACHE_TTL_SEC
            ? Number.parseInt(process.env.SCANNER_MARKET_DATA_CACHE_TTL_SEC, 10)
            : 60,
        snapshotTtlDays: process.env.SCANNER_SNAPSHOT_TTL_DAYS
            ? Number.parseInt(process.env.SCANNER_SNAPSHOT_TTL_DAYS, 10)
            : 7,
        defaultSpotFeeRate: process.env.SCANNER_DEFAULT_SPOT_FEE_RATE
            ? Number.parseFloat(process.env.SCANNER_DEFAULT_SPOT_FEE_RATE)
            : 0.001,
        defaultFuturesFeeRate: process.env.SCANNER_DEFAULT_FUTURES_FEE_RATE
            ? Number.parseFloat(process.env.SCANNER_DEFAULT_FUTURES_FEE_RATE)
            : 0.0005,
        defaultSlippage: process.env.SCANNER_DEFAULT_SLIPPAGE
            ? Number.parseFloat(process.env.SCANNER_DEFAULT_SLIPPAGE)
            : 0.0005,
        defaultPositionSizeUsd: process.env.SCANNER_DEFAULT_POSITION_SIZE_USD
            ? Number.parseFloat(process.env.SCANNER_DEFAULT_POSITION_SIZE_USD)
            : 10_000,
        arbitrageMinFundingRate: process.env.SCANNER_ARBITRAGE_MIN_FUNDING_RATE
            ? Number.parseFloat(process.env.SCANNER_ARBITRAGE_MIN_FUNDING_RATE)
            : 0.00001,
        arbitrageMinNetYield: process.env.SCANNER_ARBITRAGE_MIN_NET_YIELD
            ? Number.parseFloat(process.env.SCANNER_ARBITRAGE_MIN_NET_YIELD)
            : 0,
        arbitrageMaxSpread: process.env.SCANNER_ARBITRAGE_MAX_SPREAD
            ? Number.parseFloat(process.env.SCANNER_ARBITRAGE_MAX_SPREAD)
            : 2,
        arbitrageMinVolume24h: process.env.SCANNER_ARBITRAGE_MIN_VOLUME_24H
            ? Number.parseFloat(process.env.SCANNER_ARBITRAGE_MIN_VOLUME_24H)
            : 100_000,
        arbitrageSymbolWhitelist: (process.env.SCANNER_ARBITRAGE_SYMBOL_WHITELIST ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        arbitrageSymbolBlacklist: (process.env.SCANNER_ARBITRAGE_SYMBOL_BLACKLIST ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        arbitrageOpportunityTtlSec: process.env.SCANNER_ARBITRAGE_OPPORTUNITY_TTL_SEC
            ? Number.parseInt(process.env.SCANNER_ARBITRAGE_OPPORTUNITY_TTL_SEC, 10)
            : 300,
        intervals: {
            instrumentsSec: process.env.SCANNER_INTERVAL_INSTRUMENTS_SEC
                ? Number.parseInt(process.env.SCANNER_INTERVAL_INSTRUMENTS_SEC, 10)
                : 21_600,
            spotTickersSec: process.env.SCANNER_INTERVAL_SPOT_SEC
                ? Number.parseInt(process.env.SCANNER_INTERVAL_SPOT_SEC, 10)
                : 45,
            perpTickersSec: process.env.SCANNER_INTERVAL_PERP_SEC
                ? Number.parseInt(process.env.SCANNER_INTERVAL_PERP_SEC, 10)
                : 45,
            fundingRatesSec: process.env.SCANNER_INTERVAL_FUNDING_SEC
                ? Number.parseInt(process.env.SCANNER_INTERVAL_FUNDING_SEC, 10)
                : 180,
            openInterestSec: process.env.SCANNER_INTERVAL_OI_SEC
                ? Number.parseInt(process.env.SCANNER_INTERVAL_OI_SEC, 10)
                : 180,
            arbitrageSec: process.env.SCANNER_INTERVAL_ARBITRAGE_SEC
                ? Number.parseInt(process.env.SCANNER_INTERVAL_ARBITRAGE_SEC, 10)
                : 45,
        },
    }),
);
