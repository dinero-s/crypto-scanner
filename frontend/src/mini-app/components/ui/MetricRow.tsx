import type { ReactNode } from 'react';
import styles from './MetricRow.module.css';

interface MetricRowProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
  positive?: boolean;
  negative?: boolean;
  hint?: string;
}

export function MetricRow({ label, value, mono, positive, negative, hint }: MetricRowProps) {
  const valueClass = [
    styles.value,
    mono ? styles.mono : '',
    positive ? styles.positive : '',
    negative ? styles.negative : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <div className={styles.row}>
        <span className={styles.label}>{label}</span>
        <span className={valueClass}>{value}</span>
      </div>
      {hint && <p className={styles.muted}>{hint}</p>}
    </div>
  );
}
