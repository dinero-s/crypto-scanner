import { useNavigate } from 'react-router-dom';
import type { CashCarryOpportunity, FundingOpportunity } from '../../api/types';
import { formatExchange, formatMinutes, formatPair, formatPercent, formatRate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { RiskBadge } from '../ui/RiskBadge';
import { VerdictBadge } from '../ui/VerdictBadge';
import styles from './OpportunityTable.module.css';

interface FundingTableProps {
  items: FundingOpportunity[];
}

export function FundingTable({ items }: FundingTableProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.table}>
      {items.map((item) => (
        <div
          key={item.id}
          className={styles.row}
          onClick={() => navigate(`/mini-app/opportunity/${item.id}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate(`/mini-app/opportunity/${item.id}`);
          }}
          role="button"
          tabIndex={0}
        >
          <div>
            <p className={styles.primary}>
              {formatPair(item.baseAsset, item.quoteAsset)}
            </p>
            <p className={styles.secondary}>
              {formatExchange(item.spotExchange)} → {formatExchange(item.futuresExchange)}
            </p>
            <div className={styles.meta}>
              <Badge variant="accent">FR {formatRate(item.fundingRate)}</Badge>
              {item.timeToFundingMinutes !== undefined && (
                <Badge>{formatMinutes(item.timeToFundingMinutes)}</Badge>
              )}
              <VerdictBadge verdict={item.tradeVerdict} />
              <RiskBadge score={item.riskScore} />
            </div>
          </div>
          <div className={styles.right}>
            <span className={styles.yield}>{formatPercent(item.totalNetAfterEntryPercent)}</span>
            <span className={styles.yieldHint}>итого за интервал</span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface CashCarryTableProps {
  items: CashCarryOpportunity[];
}

export function CashCarryTable({ items }: CashCarryTableProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.table}>
      {items.map((item) => (
        <div
          key={item.id}
          className={styles.row}
          onClick={() => navigate(`/mini-app/opportunity/${item.id}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate(`/mini-app/opportunity/${item.id}`);
          }}
          role="button"
          tabIndex={0}
        >
          <div>
            <p className={styles.primary}>
              {formatPair(item.baseAsset, item.quoteAsset)}
            </p>
            <p className={styles.secondary}>
              spot {formatExchange(item.spotExchange)} · perp {formatExchange(item.futuresExchange)}
            </p>
            <div className={styles.meta}>
              <Badge variant="accent">basis {formatPercent(item.basisPercent)}</Badge>
              <Badge>score {String(item.opportunityScore)}</Badge>
              <VerdictBadge verdict={item.tradeVerdict} />
              <RiskBadge score={item.riskScore} />
            </div>
          </div>
          <div className={styles.right}>
            <span className={styles.yield}>{formatPercent(item.totalNetAfterEntryPercent)}</span>
            <span className={styles.yieldHint}>итого за интервал</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableHeader({
  count,
  sortValue,
  sortOptions,
  onSortChange,
}: {
  count: number;
  sortValue: string;
  sortOptions: { value: string; label: string }[];
  onSortChange: (value: string) => void;
}) {
  return (
    <div className={styles.header}>
      <span className={styles.count}>{String(count)} возможностей</span>
      <select
        className={styles.sortSelect}
        value={sortValue}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Сортировка"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterPanel({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button type="button" className={styles.toggleFilters} onClick={onToggle}>
        {open ? '▲ Скрыть фильтры' : '▼ Фильтры'}
      </button>
      {open && <div className={styles.filters}>{children}</div>}
    </>
  );
}

export function FilterField({
  label,
  children,
  fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <label className={styles.filterLabel}>{label}</label>
      {children}
    </div>
  );
}

export function FilterRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.filterRow}>{children}</div>;
}
