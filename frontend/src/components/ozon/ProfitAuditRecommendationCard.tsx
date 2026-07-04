import { Link } from 'react-router-dom';
import { Badge, Card } from '../ui/Page';
import type { OzonAuditRecommendation } from '../../types/ozon';
import styles from '../ui/Page.module.css';

interface ProfitAuditRecommendationCardProps {
  recommendation: OzonAuditRecommendation;
}

/** Карточка рекомендации Profit Audit */
export function ProfitAuditRecommendationCard({
  recommendation,
}: ProfitAuditRecommendationCardProps) {
  return (
    <Card className={styles.rowHighlight}>
      <div className={`${styles.flexWrap} ${styles.mbSm}`}>
        <Badge tone="info">Приоритет {recommendation.priority}</Badge>
        <Badge tone="neutral">{recommendation.status}</Badge>
      </div>
      <h3 className={styles.cardTitle}>{recommendation.title}</h3>
      <p className={styles.cardText}>{recommendation.description}</p>
      {recommendation.steps.length > 0 && (
        <ol className={styles.listSecondary}>
          {recommendation.steps.slice(0, 3).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      <Link to={`/ozon/issues/${recommendation.issueId}`} className={styles.link}>
        Открыть проблему →
      </Link>
    </Card>
  );
}
