import { miniAppFetch } from './client';
import type {
  ArbitrageOpportunityDetail,
  CashCarryOpportunity,
  CashCarryQueryParams,
  FundingOpportunity,
  FundingQueryParams,
} from './types';

export async function fetchFundingOpportunities(
  params: FundingQueryParams,
): Promise<FundingOpportunity[]> {
  return miniAppFetch<FundingOpportunity[]>('/arbitrage/funding', {
    params: params as Record<string, string | number | boolean | undefined | null | (string | number | boolean)[]>,
  });
}

export async function fetchCashCarryOpportunities(
  params: CashCarryQueryParams,
): Promise<CashCarryOpportunity[]> {
  return miniAppFetch<CashCarryOpportunity[]>('/arbitrage/cash-carry', {
    params: params as Record<string, string | number | boolean | undefined | null | (string | number | boolean)[]>,
  });
}

export async function fetchOpportunityById(id: string): Promise<ArbitrageOpportunityDetail> {
  return miniAppFetch<ArbitrageOpportunityDetail>(`/arbitrage/${id}`);
}
