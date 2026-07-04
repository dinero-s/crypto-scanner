import { Link } from 'react-router-dom';
import { Badge, Card } from '../ui/Page';
import type { OzonDetectedIssue } from '../../types/ozon';
import {
  formatConfidence,
  getAuditSeverityLabel,
  getAuditSeverityTone,
} from '../../utils/ozon';
import { IssueLossDisplay } from './IssueLossDisplay';
import styles from '../ui/Page.module.css';

interface ProfitAuditIssueCardProps {
  issue: OzonDetectedIssue;
}

/** Карточка проблемы Profit Audit */
export function ProfitAuditIssueCard({ issue }: ProfitAuditIssueCardProps) {
  return (
    <Card className={styles.rowHighlight}>
      <div className={`${styles.flexWrapCenter} ${styles.mbSm}`}>
        <Badge tone={getAuditSeverityTone(issue.severity)}>
          {getAuditSeverityLabel(issue.severity)}
        </Badge>
        <Badge tone="neutral">{issue.status}</Badge>
      </div>
      <h3 className={styles.cardTitle}>{issue.title}</h3>
      <p className={styles.cardText}>{issue.summary}</p>
      <div className={styles.summaryRow}>
        <IssueLossDisplay
          compact
          min={issue.estimatedLossMin}
          max={issue.estimatedLossMax}
          confidence={issue.lossCalculationConfidence}
          explanation={issue.lossExplanation}
        />
        <p>
          <strong>Уверенность:</strong> {formatConfidence(issue.confidence)}
        </p>
      </div>
      <Link to={`/ozon/issues/${issue.id}`} className={styles.link}>
        Открыть →
      </Link>
    </Card>
  );
}
