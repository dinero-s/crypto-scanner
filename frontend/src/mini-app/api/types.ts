/** Поддерживаемые биржи */
export type Exchange =
  | 'binance'
  | 'bybit'
  | 'okx'
  | 'gate'
  | 'kucoin'
  | 'kraken';

/** Тип арбитража */
export type ArbitrageType = 'funding' | 'cash_carry';

/** Направление funding */
export type FundingDirection =
  | 'long_spot_short_perp'
  | 'short_spot_long_perp';

/** Вердикт сделки */
export type TradeVerdict = 'profitable' | 'marginal' | 'unprofitable';

export interface ScannerDashboard {
  fundingCount: number;
  cashCarryCount: number;
  lastUpdatedAt: number | null;
  collectorsHealthy: boolean;
}

export interface CollectorRunState {
  lastRunAt: string;
  healthy: boolean;
}

export interface ScannerHealth {
  collectors: {
    lastRunAt: string | null;
    healthy: boolean;
    collectors: Record<string, CollectorRunState>;
  };
  timestamp: number;
}

export interface ExchangeInfo {
  exchange: Exchange;
  healthy: boolean;
  capabilities: {
    spot: boolean;
    perpetual: boolean;
    fundingRate: boolean;
    predictedFunding: boolean;
    openInterest: boolean;
  };
}

export interface ArbitrageStats {
  fundingCount: number;
  cashCarryCount: number;
  avgOpportunityScore: number;
  maxNetYieldPercent: number;
  lastCalculatedAt: number | null;
}

export interface FundingOpportunity {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  spotExchange: Exchange;
  futuresExchange: Exchange;
  spotSymbol: string;
  futuresSymbol: string;
  direction: FundingDirection;
  fundingRate: number;
  predictedFundingRate?: number;
  nextFundingTime?: number;
  timeToFundingMinutes?: number;
  spotAsk: number;
  perpBid: number;
  spotPerpSpreadPercent: number;
  estimatedFeesPercent: number;
  estimatedSlippagePercent: number;
  netFundingPercent: number;
  totalNetAfterEntryPercent: number;
  tradeVerdict: TradeVerdict;
  estimatedNetProfitUsd: number;
  theoreticalApr?: number;
  isTheoreticalApr: boolean;
  riskScore: number;
  opportunityScore: number;
  calculatedAt: number;
}

export interface CashCarryOpportunity {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  spotExchange: Exchange;
  futuresExchange: Exchange;
  spotSymbol: string;
  futuresSymbol: string;
  spotAsk: number;
  perpBid: number;
  basisPercent: number;
  estimatedFeesPercent: number;
  estimatedSlippagePercent: number;
  netBasisPercent: number;
  totalNetAfterEntryPercent: number;
  tradeVerdict: TradeVerdict;
  annualizedApr?: number;
  theoreticalApr?: number;
  isTheoreticalApr: boolean;
  riskScore: number;
  opportunityScore: number;
  calculatedAt: number;
}

export interface ArbitrageOpportunityDetail {
  id: string;
  type: ArbitrageType;
  baseAsset: string;
  quoteAsset: string;
  spotExchange: Exchange;
  futuresExchange: Exchange;
  spotSymbol: string;
  futuresSymbol: string;
  spotPrice: number;
  futuresPrice: number;
  fundingRate?: number;
  predictedFundingRate?: number;
  basisPercent?: number;
  netYieldPercent: number;
  tradeVerdict?: TradeVerdict;
  totalNetAfterEntryPercent?: number;
  estimatedProfitUsd: number;
  annualizedApr?: number;
  opportunityScore: number;
  riskScore: number;
  nextFundingTime?: number;
  expiresAt?: number;
  calculatedAt: number;
  metadata?: Record<string, number | string | boolean>;
}

export interface FundingQueryParams {
  exchange?: Exchange;
  symbol?: string;
  minNetYield?: number;
  minFundingRate?: number;
  minVolume24h?: number;
  allowedExchanges?: Exchange[];
  symbolWhitelist?: string[];
  limit?: number;
}

export interface CashCarryQueryParams {
  exchange?: Exchange;
  symbol?: string;
  minNetYield?: number;
  allowedExchanges?: Exchange[];
  symbolWhitelist?: string[];
  limit?: number;
}

export interface TelegramAuthResponse {
  authenticated: boolean;
  message?: string;
  token?: string;
  user?: {
    telegramId: string;
    username?: string;
    firstName?: string;
    subscriptionStatus?: string;
  };
}

export type SubscriptionStatus = 'free' | 'premium' | 'trial';

export interface SubscriptionResponse {
  status: SubscriptionStatus;
}
