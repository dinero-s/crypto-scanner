import { getRiskLabel, getRiskLevel } from '../../utils/risk';
import styles from './Badge.module.css';

interface RiskBadgeProps {
  score: number;
}

export function RiskBadge({ score }: RiskBadgeProps) {
  const level = getRiskLevel(score);
  return (
    <span className={[styles.badge, styles[level]].join(' ')}>{getRiskLabel(level)}</span>
  );
}
