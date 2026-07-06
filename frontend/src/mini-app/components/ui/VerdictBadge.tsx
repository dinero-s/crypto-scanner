import type { TradeVerdict } from '../../utils/tradeVerdict';
import { getTradeVerdictLabel } from '../../utils/tradeVerdict';
import styles from './VerdictBadge.module.css';

interface VerdictBadgeProps {
  verdict: TradeVerdict;
  className?: string;
}

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  return (
    <span className={[styles.badge, styles[verdict], className].filter(Boolean).join(' ')}>
      {getTradeVerdictLabel(verdict)}
    </span>
  );
}
