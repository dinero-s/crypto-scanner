import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getProfitAuditIssue,
  updateAuditRecommendationStatus,
  updateProfitAuditIssueStatus,
} from '../../api/ozon/ozonApi';
import { IssueLossDisplay } from '../../components/ozon/IssueLossDisplay';
import { Badge, Button, Card, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import type { OzonDetectedIssueStatus } from '../../types/ozon';
import {
  formatConfidence,
  formatDate,
  getAuditSeverityLabel,
  getAuditSeverityTone,
  getHumanError,
  getIssueTypeLabel,
} from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

const ISSUE_STATUS_LABELS: Record<OzonDetectedIssueStatus, string> = {
  NEW: 'Новая',
  VIEWED: 'Просмотрена',
  FIXED: 'Исправлена',
  IGNORED: 'Игнорируется',
};

/** Детальная страница проблемы Profit Audit */
export function IssueDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['ozon', 'profit-audit', 'issue', id],
    queryFn: () => getProfitAuditIssue(id),
    enabled: Boolean(id),
  });

  const statusMut = useMutation({
    mutationFn: (status: 'VIEWED' | 'FIXED' | 'IGNORED') =>
      updateProfitAuditIssueStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ozon', 'profit-audit'] });
    },
  });

  const recStatusMut = useMutation({
    mutationFn: (params: { recId: string; status: 'VIEWED' | 'DONE' | 'IGNORED' }) =>
      updateAuditRecommendationStatus(params.recId, params.status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ozon', 'profit-audit'] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <EmptyState title="Проблема не найдена" />;

  const { issue, recommendation } = data;
  const isResolved = issue.status === 'FIXED' || issue.status === 'IGNORED';

  return (
    <div>
      <PageHeader
        title={issue.title}
        subtitle={getIssueTypeLabel(issue.type)}
        actions={
          <Button variant="secondary" onClick={() => void navigate('/ozon/audit')}>
            ← Назад
          </Button>
        }
      />

      <Card title="Проблема">
        <div className={`${styles.flexWrap} ${styles.mbMd}`}>
          <Badge tone={getAuditSeverityTone(issue.severity)}>
            {getAuditSeverityLabel(issue.severity)}
          </Badge>
          <Badge tone="neutral">{ISSUE_STATUS_LABELS[issue.status]}</Badge>
          <Badge tone="info">{getIssueTypeLabel(issue.type)}</Badge>
        </div>
        <p>{issue.summary}</p>
        <div className={styles.summaryRow}>
          <p>
            <strong>SKU:</strong> {issue.sku ?? issue.offerId ?? issue.productId ?? '—'}
          </p>
          <p>
            <strong>Уверенность детектора:</strong> {formatConfidence(issue.confidence)}
          </p>
          <p>
            <strong>Обнаружено:</strong> {formatDate(issue.detectedAt ?? issue.createdAt)}
          </p>
          {(issue.periodFrom || issue.periodTo) && (
            <p>
              <strong>Период аудита:</strong>{' '}
              {formatDate(issue.periodFrom)} — {formatDate(issue.periodTo)}
            </p>
          )}
        </div>
      </Card>

      <Card title="Оценка потерь">
        <IssueLossDisplay
          min={issue.estimatedLossMin}
          max={issue.estimatedLossMax}
          confidence={issue.lossCalculationConfidence}
          explanation={issue.lossExplanation}
        />
      </Card>

      <Card title="Доказательства (evidence)">
        {!issue.evidence?.length ? (
          <p className={styles.muted}>Нет данных evidence</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Метрика</th>
                  <th>Значение</th>
                  <th>Порог</th>
                  <th>Период</th>
                </tr>
              </thead>
              <tbody>
                {issue.evidence.map((row) => (
                  <tr key={`${row.metric}-${String(row.period ?? '')}`}>
                    <td>{row.metric}</td>
                    <td>{String(row.value ?? '—')}</td>
                    <td>{row.threshold !== undefined ? String(row.threshold) : '—'}</td>
                    <td>{row.period ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {recommendation ? (
        <Card title="Рекомендация">
          <div className={styles.mbSm}>
            <Badge tone="neutral">{recommendation.status}</Badge>
          </div>
          <h3 className={styles.cardTitle}>{recommendation.title}</h3>
          <p className={styles.cardText}>{recommendation.description}</p>
          <ol className={styles.listSecondary}>
            {recommendation.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {(recommendation.estimatedLossMin !== undefined ||
            recommendation.estimatedLossMax !== undefined ||
            recommendation.lossExplanation) && (
            <div className={styles.mtMd}>
              <IssueLossDisplay
                min={recommendation.estimatedLossMin ?? recommendation.expectedEffectMin}
                max={recommendation.estimatedLossMax ?? recommendation.expectedEffectMax}
                confidence={recommendation.lossCalculationConfidence}
                explanation={recommendation.lossExplanation}
              />
            </div>
          )}
        </Card>
      ) : (
        <Card title="Рекомендация">
          <EmptyState title="Рекомендация не найдена" />
        </Card>
      )}

      {!isResolved && (
        <div className={styles.flexWrap}>
          {issue.status === 'NEW' && (
            <Button
              variant="secondary"
              disabled={statusMut.isPending}
              onClick={() => statusMut.mutate('VIEWED')}
            >
              Отметить как просмотрено
            </Button>
          )}
          <Button disabled={statusMut.isPending} onClick={() => statusMut.mutate('FIXED')}>
            Отметить как исправлено
          </Button>
          <Button
            variant="secondary"
            disabled={statusMut.isPending}
            onClick={() => statusMut.mutate('IGNORED')}
          >
            Игнорировать
          </Button>
          {recommendation &&
            recommendation.status !== 'DONE' &&
            recommendation.status !== 'IGNORED' && (
              <Button
                variant="secondary"
                disabled={recStatusMut.isPending}
                onClick={() =>
                  recStatusMut.mutate({ recId: recommendation.id, status: 'DONE' })
                }
              >
                Выполнено
              </Button>
            )}
        </div>
      )}

      <p className={styles.muted}>
        <Link to="/ozon/audit" className={styles.link}>
          ← Вернуться к аудиту
        </Link>
      </p>
    </div>
  );
}
