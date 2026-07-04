import { useNavigate } from 'react-router-dom';
import type { ArbitrageOpportunityDetail } from '../../api/types';
import {
  formatExchange,
  formatPair,
  formatPercent,
  formatTimestamp,
} from '../../utils/format';
import { Badge } from '../ui/Badge';
import { RiskBadge } from '../ui/RiskBadge';
import oppStyles from './OpportunityTable.module.css';
import styles from './TopOpportunityCard.module.css';

interface TopOpportunityCardProps {
  item: ArbitrageOpportunityDetail;
  rank: number;
}

export function TopOpportunityCard({ item, rank }: TopOpportunityCardProps) {
  const navigate = useNavigate();
  const typeLabel = item.type === 'funding' ? 'Funding' : 'Cash & Carry';

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/mini-app/opportunity/${item.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/mini-app/opportunity/${item.id}`);
      }}
      role="button"
      tabIndex={0}
    >
      <div>
        <p className={styles.rank}>#{String(rank)}</p>
        <p className={oppStyles.primary}>{formatPair(item.baseAsset, item.quoteAsset)}</p>
        <p className={oppStyles.secondary}>
          {formatExchange(item.spotExchange)} · score {String(item.opportunityScore)}
        </p>
        <div className={oppStyles.meta}>
          <Badge variant="accent" className={styles.typeBadge}>
            {typeLabel}
          </Badge>
          <RiskBadge score={item.riskScore} />
        </div>
      </div>
      <div className={oppStyles.right}>
        <span className={oppStyles.yield}>{formatPercent(item.netYieldPercent)}</span>
        <span className={oppStyles.yieldHint}>est. net yield</span>
        <span className={oppStyles.yieldHint}>{formatTimestamp(item.calculatedAt)}</span>
      </div>
    </div>
  );
}
