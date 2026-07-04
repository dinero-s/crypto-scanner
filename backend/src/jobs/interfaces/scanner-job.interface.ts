import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

/** Payload job сбора market data */
export interface MarketDataCollectJobData {
    exchanges: ExchangeEnum[];
    symbols: string[];
    force?: boolean;
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
