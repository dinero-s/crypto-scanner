import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { fetchFundingOpportunities } from '../api/arbitrageApi';
import type { Exchange, FundingQueryParams } from '../api/types';
import {
  FilterField,
  FilterPanel,
  FilterRow,
  FundingTable,
  TableHeader,
} from '../components/opportunities/OpportunityTable';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateBlocks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSettings } from '../context/SettingsProvider';
import { parseSymbolWhitelist } from '../schemas/settings.schema';
import {
  sortFundingOpportunities,
  type FundingSortField,
} from '../utils/sort';
import { getHumanError } from '../../utils/format';

const EXCHANGES: Exchange[] = ['binance', 'bybit', 'okx', 'gate', 'kucoin', 'kraken'];

const SORT_OPTIONS: { value: FundingSortField; label: string }[] = [
  { value: 'netYield', label: 'Net yield ↓' },
  { value: 'fundingRate', label: 'Funding rate ↓' },
  { value: 'timeToFunding', label: 'Time to funding ↑' },
];

export function FundingPage() {
  const { settings } = useSettings();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exchange, setExchange] = useState<Exchange | ''>('');
  const [symbol, setSymbol] = useState('');
  const [minFunding, setMinFunding] = useState('');
  const [minNetYield, setMinNetYield] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [sortField, setSortField] = useState<FundingSortField>('netYield');

  const debouncedSymbol = useDebouncedValue(symbol, 400);

  const queryParams = useMemo((): FundingQueryParams => {
    const whitelist = parseSymbolWhitelist(settings.symbolWhitelist);
    return {
      exchange: exchange || undefined,
      symbol: debouncedSymbol || undefined,
      minFundingRate: minFunding ? Number(minFunding) / 100 : undefined,
      minNetYield: minNetYield ? Number(minNetYield) : undefined,
      minVolume24h: minVolume ? Number(minVolume) : undefined,
      allowedExchanges: settings.allowedExchanges,
      symbolWhitelist: whitelist.length > 0 ? whitelist : undefined,
      limit: 100,
    };
  }, [exchange, debouncedSymbol, minFunding, minNetYield, minVolume, settings]);

  const query = useQuery({
    queryKey: ['mini-app', 'funding', queryParams],
    queryFn: () => fetchFundingOpportunities(queryParams),
  });

  const sorted = useMemo(() => {
    if (!query.data) return [];
    const desc = sortField !== 'timeToFunding';
    return sortFundingOpportunities(query.data, sortField, desc);
  }, [query.data, sortField]);

  if (query.isLoading) {
    return <SkeletonTableRows count={6} />;
  }

  if (query.error) {
    return (
      <ErrorState
        message={getHumanError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await query.refetch(); }}>
      <FilterPanel open={filtersOpen} onToggle={() => setFiltersOpen((v) => !v)}>
        <FilterRow>
          <FilterField label="Биржа">
            <select value={exchange} onChange={(e) => setExchange(e.target.value as Exchange | '')}>
              <option value="">Все</option>
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Символ">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BTCUSDT"
            />
          </FilterField>
        </FilterRow>
        <FilterRow>
          <FilterField label="Min funding (%)">
            <input
              type="number"
              step="0.001"
              min="0"
              value={minFunding}
              onChange={(e) => setMinFunding(e.target.value)}
              placeholder="0.01"
            />
          </FilterField>
          <FilterField label="Min net yield (%)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={minNetYield}
              onChange={(e) => setMinNetYield(e.target.value)}
              placeholder="0.1"
            />
          </FilterField>
        </FilterRow>
        <FilterField label="Min volume 24h (USD)" fullWidth>
          <input
            type="number"
            min="0"
            value={minVolume}
            onChange={(e) => setMinVolume(e.target.value)}
            placeholder="1000000"
          />
        </FilterField>
      </FilterPanel>

      <TableHeader
        count={sorted.length}
        sortValue={sortField}
        sortOptions={SORT_OPTIONS}
        onSortChange={(v) => setSortField(v as FundingSortField)}
      />

      {sorted.length === 0 ? (
        <EmptyState
          title="Нет funding opportunities"
          description="Попробуйте ослабить фильтры или дождитесь следующего цикла сканера."
        />
      ) : (
        <FundingTable items={sorted} />
      )}
    </PullToRefresh>
  );
}
