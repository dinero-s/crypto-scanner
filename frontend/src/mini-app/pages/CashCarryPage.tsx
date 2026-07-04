import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { fetchCashCarryOpportunities } from '../api/arbitrageApi';
import type { CashCarryQueryParams, Exchange } from '../api/types';
import {
  CashCarryTable,
  FilterField,
  FilterPanel,
  FilterRow,
  TableHeader,
} from '../components/opportunities/OpportunityTable';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateBlocks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSettings } from '../context/SettingsProvider';
import { parseSymbolWhitelist } from '../schemas/settings.schema';
import {
  filterCashCarryClientSide,
  sortCashCarryOpportunities,
  type CashCarrySortField,
} from '../utils/sort';
import { getHumanError } from '../../utils/format';

const EXCHANGES: Exchange[] = ['binance', 'bybit', 'okx', 'gate', 'kucoin', 'kraken'];

const SORT_OPTIONS: { value: CashCarrySortField; label: string }[] = [
  { value: 'netBasis', label: 'Net basis ↓' },
  { value: 'opportunityScore', label: 'Score ↓' },
];

export function CashCarryPage() {
  const { settings } = useSettings();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [spotExchange, setSpotExchange] = useState<Exchange | ''>('');
  const [futuresExchange, setFuturesExchange] = useState<Exchange | ''>('');
  const [symbol, setSymbol] = useState('');
  const [minBasis, setMinBasis] = useState('');
  const [minNetYield, setMinNetYield] = useState('');
  const [sortField, setSortField] = useState<CashCarrySortField>('netBasis');

  const debouncedSymbol = useDebouncedValue(symbol, 400);

  const queryParams = useMemo((): CashCarryQueryParams => {
    const whitelist = parseSymbolWhitelist(settings.symbolWhitelist);
    return {
      exchange: spotExchange || undefined,
      symbol: debouncedSymbol || undefined,
      minNetYield: minNetYield ? Number(minNetYield) : undefined,
      allowedExchanges: settings.allowedExchanges,
      symbolWhitelist: whitelist.length > 0 ? whitelist : undefined,
      limit: 100,
    };
  }, [spotExchange, debouncedSymbol, minNetYield, settings]);

  const query = useQuery({
    queryKey: ['mini-app', 'cash-carry', queryParams],
    queryFn: () => fetchCashCarryOpportunities(queryParams),
  });

  const sorted = useMemo(() => {
    if (!query.data) return [];
    const filtered = filterCashCarryClientSide(query.data, {
      futuresExchange: futuresExchange || undefined,
      minBasis: minBasis ? Number(minBasis) : undefined,
    });
    return sortCashCarryOpportunities(filtered, sortField, true);
  }, [query.data, futuresExchange, minBasis, sortField]);

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
          <FilterField label="Spot exchange">
            <select
              value={spotExchange}
              onChange={(e) => setSpotExchange(e.target.value as Exchange | '')}
            >
              <option value="">Все</option>
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Futures exchange">
            <select
              value={futuresExchange}
              onChange={(e) => setFuturesExchange(e.target.value as Exchange | '')}
            >
              <option value="">Все</option>
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </FilterField>
        </FilterRow>
        <FilterRow>
          <FilterField label="Символ">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BTCUSDT"
            />
          </FilterField>
          <FilterField label="Min basis (%)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={minBasis}
              onChange={(e) => setMinBasis(e.target.value)}
              placeholder="0.1"
            />
          </FilterField>
        </FilterRow>
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
      </FilterPanel>

      <TableHeader
        count={sorted.length}
        sortValue={sortField}
        sortOptions={SORT_OPTIONS}
        onSortChange={(v) => setSortField(v as CashCarrySortField)}
      />

      {sorted.length === 0 ? (
        <EmptyState
          title="Нет cash & carry opportunities"
          description="Попробуйте ослабить фильтры или дождитесь следующего цикла сканера."
        />
      ) : (
        <CashCarryTable items={sorted} />
      )}
    </PullToRefresh>
  );
}
