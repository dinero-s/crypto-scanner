import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

/** Cash & Carry / Spot-Futures basis арбитраж */
export interface CashCarryOpportunityInterface {
    symbol: string;
    exchange: ExchangeEnum;
    spotPrice: number;
    futuresPrice: number;
    basisPct: number;
    annualizedBasisPct: number;
    netYieldPct: number;
    daysToExpiry?: number;
    calculatedAt: number;
}
