import { miniAppFetch } from './client';
import type {
  ArbitrageOpportunityDetail,
  ArbitrageStats,
  ExchangeInfo,
  ScannerDashboard,
  ScannerHealth,
} from './types';

export async function fetchDashboard(): Promise<ScannerDashboard> {
  return miniAppFetch<ScannerDashboard>('/mini-app/dashboard');
}

export async function fetchScannerHealth(): Promise<ScannerHealth> {
  return miniAppFetch<ScannerHealth>('/mini-app/health');
}

export async function fetchExchanges(): Promise<ExchangeInfo[]> {
  return miniAppFetch<ExchangeInfo[]>('/mini-app/exchanges');
}

export async function fetchArbitrageStats(): Promise<ArbitrageStats> {
  return miniAppFetch<ArbitrageStats>('/arbitrage/stats');
}

export async function fetchTopOpportunities(limit = 3): Promise<ArbitrageOpportunityDetail[]> {
  return miniAppFetch<ArbitrageOpportunityDetail[]>('/arbitrage/top', {
    params: { limit },
  });
}
