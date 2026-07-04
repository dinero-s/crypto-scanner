import type { CashCarryOpportunity, FundingOpportunity } from '../api/types';

export type FundingSortField = 'netYield' | 'fundingRate' | 'timeToFunding';
export type CashCarrySortField = 'netBasis' | 'opportunityScore';

export function sortFundingOpportunities(
  items: FundingOpportunity[],
  field: FundingSortField,
  desc = true,
): FundingOpportunity[] {
  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'netYield':
        cmp = a.netFundingPercent - b.netFundingPercent;
        break;
      case 'fundingRate':
        cmp = a.fundingRate - b.fundingRate;
        break;
      case 'timeToFunding':
        cmp = (a.timeToFundingMinutes ?? Infinity) - (b.timeToFundingMinutes ?? Infinity);
        break;
    }
    return desc ? -cmp : cmp;
  });
  return sorted;
}

export function sortCashCarryOpportunities(
  items: CashCarryOpportunity[],
  field: CashCarrySortField,
  desc = true,
): CashCarryOpportunity[] {
  const sorted = [...items].sort((a, b) => {
    const cmp =
      field === 'netBasis'
        ? a.netBasisPercent - b.netBasisPercent
        : a.opportunityScore - b.opportunityScore;
    return desc ? -cmp : cmp;
  });
  return sorted;
}

export function filterCashCarryClientSide(
  items: CashCarryOpportunity[],
  filters: {
    futuresExchange?: string;
    minBasis?: number;
  },
): CashCarryOpportunity[] {
  return items.filter((item) => {
    if (filters.futuresExchange && item.futuresExchange !== filters.futuresExchange) {
      return false;
    }
    if (filters.minBasis !== undefined && item.basisPercent < filters.minBasis) {
      return false;
    }
    return true;
  });
}
