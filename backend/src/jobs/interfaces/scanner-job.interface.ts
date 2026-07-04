import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

/** Payload job сбора market data (legacy) */
export interface MarketDataCollectJobData {
    exchanges: ExchangeEnum[];
    symbols: string[];
    force?: boolean;
    scheduledAt: number;
}

/** Payload job сбора инструментов */
export interface CollectInstrumentsJobData {
    scheduledAt: number;
}

/** Payload job сбора spot-тикеров */
export interface CollectSpotTickersJobData {
    scheduledAt: number;
}

/** Payload job сбора perp-тикеров */
export interface CollectPerpTickersJobData {
    scheduledAt: number;
}

/** Payload job сбора funding rates */
export interface CollectFundingRatesJobData {
    scheduledAt: number;
}

/** Payload job сбора open interest */
export interface CollectOpenInterestJobData {
    scheduledAt: number;
}

/** Payload job очистки старых снимков */
export interface CleanupSnapshotsJobData {
    scheduledAt: number;
}

/** Payload job пересчёта арбитража */
export interface ArbitrageCalculateJobData {
    scheduledAt: number;
}

/** Payload job проверки алертов */
export interface AlertEvaluateJobData {
    scheduledAt: number;
}

export type ScannerMarketDataJobData =
    | MarketDataCollectJobData
    | CollectInstrumentsJobData
    | CollectSpotTickersJobData
    | CollectPerpTickersJobData
    | CollectFundingRatesJobData
    | CollectOpenInterestJobData
    | CleanupSnapshotsJobData;
