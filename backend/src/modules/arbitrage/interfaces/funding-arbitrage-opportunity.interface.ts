import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { FundingDirectionEnum } from '../enums/arbitrage-type.enum';

/** Funding rate арбитраж (delta-neutral) */
export interface FundingArbitrageOpportunityInterface {
    symbol: string;
    exchange: ExchangeEnum;
    direction: FundingDirectionEnum;
    fundingRate: number;
    predictedFundingRate?: number;
    annualizedYieldPct: number;
    netYieldPct: number;
    nextFundingTime: number;
    calculatedAt: number;
}
