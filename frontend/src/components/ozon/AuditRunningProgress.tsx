import { Badge } from '../ui/Page';
import type { OzonAuditRunProgressStep } from '../../types/ozon';
import { getProgressStepLabel } from '../../utils/ozon';
import styles from '../ui/Page.module.css';

const PROGRESS_STEPS: OzonAuditRunProgressStep[] = [
  'QUEUED',
  'SYNC',
  'METRICS_BUILD',
  'DATA_QUALITY',
  'ISSUES_DETECT',
  'RECOMMENDATIONS_BUILD',
  'AI_REPORT',
  'DONE',
];

interface AuditRunningProgressProps {
  progressStep: OzonAuditRunProgressStep | string;
}

/** Индикатор прогресса запущенного аудита */
export function AuditRunningProgress({ progressStep }: AuditRunningProgressProps) {
  const currentIndex = PROGRESS_STEPS.indexOf(progressStep as OzonAuditRunProgressStep);

  return (
    <div className={styles.mtMd}>
      <p className={`${styles.cardText} ${styles.mbMd}`}>
        Текущий шаг: <strong>{getProgressStepLabel(progressStep)}</strong>
      </p>
      <div className={styles.progressSteps}>
        {PROGRESS_STEPS.filter((s) => s !== 'DONE').map((step, index) => {
          const isDone = currentIndex > index;
          const isCurrent = step === progressStep;
          return (
            <div
              key={step}
              className={`${styles.progressStep}${isDone || isCurrent ? '' : ` ${styles.progressStepPending}`}`}
            >
              <Badge tone={isDone ? 'success' : isCurrent ? 'info' : 'neutral'}>
                {isDone ? '✓' : isCurrent ? '…' : String(index + 1)}
              </Badge>
              <span>{getProgressStepLabel(step)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
