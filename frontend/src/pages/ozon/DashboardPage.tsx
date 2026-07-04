import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  getAuditStatus,
  getCompetitors,
  getConnections,
  getLatestAuditReport,
  getProfitAuditIssues,
} from '../../api/ozon/ozonApi';
import { Badge, Button, Card, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import type { OzonAuditUiState } from '../../types/ozon';
import { auditStatusRefetchInterval } from '../../hooks/useAuditPollingInterval';
import {
  buildAuditSummaryFromRun,
  formatDate,
  formatLossRange,
  getHumanError,
  mapConnectionStatus,
} from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

const AUDIT_STATE_LABELS: Record<OzonAuditUiState, string> = {
  NO_CONNECTION: 'Нет подключения',
  CONNECTED_NOT_AUDITED: 'Не выполнялся',
  AUDIT_RUNNING: 'Выполняется',
  AUDIT_READY: 'Готов',
  AUDIT_FAILED: 'Ошибка',
  PARTIAL_DATA: 'Частичный',
};

/** Главный dashboard — фокус на Profit Audit */
export function DashboardPage() {
  const connections = useQuery({ queryKey: ['ozon', 'connections'], queryFn: getConnections });

  const activeConnectionId = connections.data?.[0]?.id;

  const auditStatus = useQuery({
    queryKey: ['ozon', 'profit-audit', 'status', activeConnectionId],
    queryFn: () => getAuditStatus(activeConnectionId),
    enabled: Boolean(activeConnectionId),
    refetchInterval: (query) =>
      query.state.data?.state === 'AUDIT_RUNNING'
        ? auditStatusRefetchInterval(query)
        : false,
  });

  const latestAudit = useQuery({
    queryKey: ['ozon', 'profit-audit', 'latest', activeConnectionId],
    queryFn: () => getLatestAuditReport(activeConnectionId),
    enabled:
      Boolean(activeConnectionId) &&
      (auditStatus.data?.state === 'AUDIT_READY' ||
        auditStatus.data?.state === 'PARTIAL_DATA'),
  });

  const activeIssues = useQuery({
    queryKey: ['ozon', 'profit-audit', 'active-issues-count'],
    queryFn: () =>
      getProfitAuditIssues({ limit: 3, page: 1, excludeResolved: true }),
    enabled:
      auditStatus.data?.state === 'AUDIT_READY' ||
      auditStatus.data?.state === 'PARTIAL_DATA',
  });

  const competitors = useQuery({
    queryKey: ['ozon', 'competitors'],
    queryFn: getCompetitors,
    enabled: (connections.data?.length ?? 0) > 0,
  });

  if (connections.isLoading) return <LoadingState message="Загрузка dashboard…" />;

  if (connections.error) {
    return <ErrorState message={getHumanError(connections.error)} />;
  }

  const connList = connections.data ?? [];
  const activeConn = connList.find((c) => c.status === 'active' || c.status === 'ACTIVE');
  const status = auditStatus.data;
  const auditRun = status?.auditRun ?? latestAudit.data?.auditRun;
  const summary = buildAuditSummaryFromRun(auditRun);
  const dataQuality = latestAudit.data?.dataQuality;
  const topRecommendations = latestAudit.data?.topRecommendations ?? [];
  const activeCompetitors = (competitors.data ?? []).filter((c) => c.status === 'active').length;
  const auditState = status?.state;
  const hasAuditData =
    auditState === 'AUDIT_READY' || auditState === 'PARTIAL_DATA';

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Подключили Ozon → получили аудит потерь → поняли, что делать сегодня"
      />

      <Card title="Подключение Ozon">
        {!connList.length ? (
          <>
            <EmptyState
              title="Ozon не подключён"
              description="Подключите API-ключи, чтобы запустить первый аудит"
              action={
                <Link to="/ozon/connections">
                  <Button>Подключить Ozon</Button>
                </Link>
              }
            />
          </>
        ) : (
          <div className={styles.summaryRow}>
            <p>
              <strong>Магазин:</strong> {activeConn?.sellerName ?? connList[0].sellerName}
            </p>
            <p>
              <strong>Статус:</strong>{' '}
              <Badge tone={activeConn ? 'success' : 'warning'}>
                {mapConnectionStatus(String(activeConn?.status ?? connList[0].status))}
              </Badge>
            </p>
            <p>
              <strong>Последняя синхронизация:</strong>{' '}
              {formatDate(activeConn?.lastSyncAt ?? connList[0].lastSyncAt)}
            </p>
          </div>
        )}
      </Card>

      <Card title="AI Profit Audit">
        {!connList.length ? (
          <p className={styles.muted}>Сначала подключите Ozon</p>
        ) : auditStatus.isLoading ? (
          <LoadingState message="Проверка статуса аудита…" />
        ) : auditState === 'CONNECTED_NOT_AUDITED' ? (
          <>
            <EmptyState
              title="Аудит ещё не выполнялся"
              description="Запустите первый аудит — система синхронизирует данные и найдёт потери"
            />
            <Link to="/ozon/audit">
              <Button>Запустить первый аудит</Button>
            </Link>
          </>
        ) : auditState === 'AUDIT_RUNNING' ? (
          <>
            <Badge tone="info">{AUDIT_STATE_LABELS.AUDIT_RUNNING}</Badge>
            {auditRun?.progressStep && (
              <p className={`${styles.muted} ${styles.mtSm}`}>
                Шаг: {auditRun.progressStep}
              </p>
            )}
            <p className={`${styles.muted} ${styles.mtSm}`}>
              Синхронизируем данные и ищем потери…
            </p>
          </>
        ) : auditState === 'AUDIT_FAILED' ? (
          <>
            <Badge tone="danger">{AUDIT_STATE_LABELS.AUDIT_FAILED}</Badge>
            {auditRun?.errorMessage && (
              <p className={`${styles.muted} ${styles.mtSm}`}>
                {auditRun.errorMessage}
              </p>
            )}
            <Link to="/ozon/audit" className={`${styles.link} ${styles.linkBlock}`}>
              Запустить повторно →
            </Link>
          </>
        ) : hasAuditData ? (
          <>
            <div className={`${styles.summaryRow} ${styles.mbMd}`}>
              <p>
                <strong>Статус:</strong>{' '}
                <Badge tone={auditState === 'PARTIAL_DATA' ? 'warning' : 'success'}>
                  {auditState ? AUDIT_STATE_LABELS[auditState] : '—'}
                </Badge>
              </p>
              {auditRun && (
                <p>
                  <strong>Период:</strong>{' '}
                  {formatDate(auditRun.periodFrom)} — {formatDate(auditRun.periodTo)} (
                  {auditRun.periodDays} дн.)
                </p>
              )}
            </div>

            <div className={styles.grid}>
              <div className={styles.stat}>
                <strong>{formatDate(auditRun?.finishedAt ?? latestAudit.data?.report?.createdAt)}</strong>
                <span>Последний аудит</span>
              </div>
              <div className={styles.stat}>
                <strong>{activeIssues.data?.total ?? auditRun?.issuesCount ?? 0}</strong>
                <span>Активных проблем</span>
              </div>
              <div className={styles.stat}>
                <strong>{auditRun?.criticalIssuesCount ?? summary?.criticalIssues ?? 0}</strong>
                <span>Критичных</span>
              </div>
              <div className={styles.stat}>
                <strong className={styles.statCompact}>
                  {formatLossRange(
                    summary?.estimatedLossMin ?? auditRun?.estimatedLossMin,
                    summary?.estimatedLossMax ?? auditRun?.estimatedLossMax,
                  )}
                </strong>
                <span>Потенциальные потери</span>
              </div>
              {(auditRun?.dataQualityScore ?? dataQuality?.score) !== undefined && (
                <div className={styles.stat}>
                  <strong>{auditRun?.dataQualityScore ?? dataQuality?.score}/100</strong>
                  <span>Качество данных</span>
                </div>
              )}
            </div>

            {auditState === 'PARTIAL_DATA' && (
              <p className={`${styles.muted} ${styles.mtMd}`}>
                Аудит частичный: не все данные доступны. Некоторые направления не проверены.
              </p>
            )}

            {topRecommendations.length > 0 && (
              <div className={styles.mtLg}>
                <strong style={{ fontSize: 14 }}>Топ-3 рекомендации</strong>
                <ol className={styles.orderedList}>
                  {topRecommendations.slice(0, 3).map((rec) => (
                    <li key={rec.id}>
                      <Link to={`/ozon/issues/${rec.issueId}`} className={styles.link}>
                        {rec.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <Link to="/ozon/audit" className={`${styles.link} ${styles.linkBlock}`}>
              Открыть AI Аудит →
            </Link>
          </>
        ) : (
          <EmptyState title="Нет данных аудита" />
        )}
      </Card>

      <Card title="Дополнительно">
        <p className={`${styles.muted} ${styles.mbMd}`}>
          Мониторинг конкурентов — добавьте URL карточек Ozon, чтобы отслеживать доступные
          официальные изменения.
        </p>
        <p>
          <strong>Активных конкурентов:</strong> {activeCompetitors}
        </p>
        <div className={`${styles.flexWrap} ${styles.mtMd}`}>
          <Link to="/ozon/competitors">
            <Button>Открыть мониторинг</Button>
          </Link>
          <Link to="/ozon/alerts">
            <Button>Системные alerts</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
