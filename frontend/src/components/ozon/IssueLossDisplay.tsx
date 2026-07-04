import type { OzonLossCalculationConfidence } from '../../types/ozon';
import { formatLossDisplay } from '../../utils/ozon';
import styles from '../ui/Page.module.css';

interface IssueLossDisplayProps {
  min?: number;
  max?: number;
  confidence?: OzonLossCalculationConfidence | string;
  explanation?: string;
  compact?: boolean;
}

/** Отображение оценки потерь с учётом confidence */
export function IssueLossDisplay({
  min,
  max,
  confidence,
  explanation,
  compact = false,
}: IssueLossDisplayProps) {
  const display = formatLossDisplay({ min, max, confidence, explanation });

  return (
    <div>
      <p style={{ margin: compact ? 0 : '0 0 4px', fontSize: compact ? 14 : undefined }}>
        <strong>{compact ? '' : 'Потери: '}</strong>
        {display.primary}
      </p>
      {display.secondary && (
        <p className={styles.muted} style={{ margin: 0, fontSize: 13 }}>
          {display.secondary}
        </p>
      )}
    </div>
  );
}
