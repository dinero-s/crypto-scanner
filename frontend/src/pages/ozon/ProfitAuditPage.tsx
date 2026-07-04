import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  getAuditStatus,
  getConnections,
  getLatestAuditReport,
  runProfitAudit,
} from '../../api/ozon/ozonApi';
import { AuditDataQualityCard } from '../../components/ozon/AuditDataQualityCard';
import { AuditRunningProgress } from '../../components/ozon/AuditRunningProgress';
import { ProfitAuditIssueCard } from '../../components/ozon/ProfitAuditIssueCard';
import { ProfitAuditRecommendationCard } from '../../components/ozon/ProfitAuditRecommendationCard';
import { LegalNotice } from '../../components/ui/LegalNotice';
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
  CONNECTED_NOT_AUDITED: 'Готов к первому аудиту',
  AUDIT_RUNNING: 'Аудит выполняется',
  AUDIT_READY: 'Аудит готов',
  AUDIT_FAILED: 'Ошибка аудита',
  PARTIAL_DATA: 'Аудит частичный',
};

const PERIOD_OPTIONS = [
  { value: 30 as const, label: '30 дней' },
  { value: 60 as const, label: '60 дней' },
  { value: 90 as const, label: '90 дней' },
];

/** Главная страница AI Profit Audit */
export function ProfitAuditPage() {
  const queryClient = useQueryClient();
  const [connectionId, setConnectionId] = useState<string>('');
  const [periodDays, setPeriodDays] = useState<30 | 60 | 90>(30);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const connectionsQuery = useQuery({
    queryKey: ['ozon', 'connections'],
    queryFn: getConnections,
  });

  const activeConnectionId = useMemo(() => {
    if (connectionId) return connectionId;
    return connectionsQuery.data?.[0]?.id ?? '';
  }, [connectionId, connectionsQuery.data]);

  const statusQuery = useQuery({
    queryKey: ['ozon', 'profit-audit', 'status', activeConnectionId],
    queryFn: () => getAuditStatus(activeConnectionId || undefined),
    enabled: Boolean(activeConnectionId),
    refetchInterval: (query) =>
      query.state.data?.state === 'AUDIT_RUNNING'
        ? auditStatusRefetchInterval(query)
        : false,
  });

  const latestQuery = useQuery({
    queryKey: ['ozon', 'profit-audit', 'latest', activeConnectionId],
    queryFn: () => getLatestAuditReport(activeConnectionId || undefined),
    enabled:
      Boolean(activeConnectionId) &&
      (statusQuery.data?.state === 'AUDIT_READY' ||
        statusQuery.data?.state === 'PARTIAL_DATA'),
  });

  const runMut = useMutation({
    mutationFn: () =>
      runProfitAudit({
        connectionId: activeConnectionId || undefined,
        periodDays,
      }),
    onSuccess: () => {
      setRunMessage('Аудит запущен. Синхронизируем данные и ищем потери…');
      void queryClient.invalidateQueries({ queryKey: ['ozon', 'profit-audit'] });
    },
    onError: (error) => {
      setRunMessage(getHumanError(error));
    },
  });

  if (connectionsQuery.isLoading) {
    return <LoadingState message="Загрузка подключений…" />;
  }

  if (connectionsQuery.error) {
    return <ErrorState message={getHumanError(connectionsQuery.error)} />;
  }

  const connections = connectionsQuery.data ?? [];

  if (!connections.length) {
    return (
      <div>
        <PageHeader title="AI Profit Audit" subtitle="Где вы теряете деньги и что сделать сегодня" />
        <EmptyState
          title="Нет подключённого кабинета Ozon"
          description="Подключите API-ключи, чтобы запустить аудит"
          action={
            <Link to="/ozon/connections">
              <Button>Подключить Ozon</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selectedConnection =
    connections.find((c) => c.id === activeConnectionId) ?? connections[0];
  const auditState = statusQuery.data?.state ?? 'CONNECTED_NOT_AUDITED';
  const auditRun = statusQuery.data?.auditRun ?? latestQuery.data?.auditRun;
  const summary = buildAuditSummaryFromRun(auditRun);
  const dataQuality = latestQuery.data?.dataQuality;
  const topIssues = latestQuery.data?.topIssues ?? [];
  const topRecommendations = latestQuery.data?.topRecommendations ?? [];
  const showReport = auditState === 'AUDIT_READY' || auditState === 'PARTIAL_DATA';
  const isRunning = auditState === 'AUDIT_RUNNING';

  return (
    <div>
      <PageHeader
        title="AI Profit Audit"
        subtitle="Детерминированный аудит потерь + AI-объяснение на основе фактов"
        actions={
          !isRunning ? (
            <Button
              disabled={runMut.isPending || !activeConnectionId}
              onClick={() => {
                setRunMessage(null);
                runMut.mutate();
              }}
            >
              {runMut.isPending
                ? 'Запуск…'
                : auditState === 'CONNECTED_NOT_AUDITED'
                  ? 'Запустить первый аудит'
                  : auditState === 'AUDIT_FAILED'
                    ? 'Запустить повторно'
                    : 'Запустить аудит'}
            </Button>
          ) : undefined
        }
      />

      <LegalNotice />

      {connections.length > 1 && (
        <div className={styles.filters}>
          <label htmlFor="connection-select">Кабинет</label>
          <select
            id="connection-select"
            value={activeConnectionId}
            onChange={(e) => setConnectionId(e.target.value)}
            disabled={isRunning}
          >
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.sellerName}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isRunning && (
        <div className={styles.filters}>
          <label htmlFor="period-select">Период аудита</label>
          <select
            id="period-select"
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value) as 30 | 60 | 90)}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <Card title="Статус">
        <div className={styles.summaryRow}>
          <p>
            <strong>Магазин:</strong> {selectedConnection.sellerName}
          </p>
          <p>
            <strong>Подключение:</strong>{' '}
            <Badge
              tone={
                selectedConnection.status === 'active' || selectedConnection.status === 'ACTIVE'
                  ? 'success'
                  : 'warning'
              }
            >
              {mapConnectionStatus(String(selectedConnection.status))}
            </Badge>
          </p>
          <p>
            <strong>Аудит:</strong>{' '}
            <Badge
              tone={
                auditState === 'AUDIT_READY'
                  ? 'success'
                  : auditState === 'AUDIT_RUNNING'
                    ? 'info'
                    : auditState === 'AUDIT_FAILED'
                      ? 'danger'
                      : auditState === 'PARTIAL_DATA'
                        ? 'warning'
                        : 'neutral'
              }
            >
              {AUDIT_STATE_LABELS[auditState]}
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
      </Card>

      {runMessage && (
        <Card>
          <p className={styles.cardText}>{runMessage}</p>
        </Card>
      )}

      {isRunning && (
        <Card title="Выполняется аудит">
          <LoadingState message="Синхронизируем данные и ищем потери. Это может занять несколько минут…" />
          {auditRun?.progressStep && (
            <AuditRunningProgress progressStep={auditRun.progressStep} />
          )}
        </Card>
      )}

      {auditState === 'CONNECTED_NOT_AUDITED' && (
        <Card title="Первый аудит">
          <EmptyState
            title="Аудит ещё не выполнялся"
            description="Нажмите «Запустить первый аудит» — система синхронизирует данные через официальный API Ozon, найдёт проблемы и сформирует отчёт"
          />
        </Card>
      )}

      {auditState === 'AUDIT_FAILED' && (
        <Card title="Ошибка">
          <EmptyState
            title="Не удалось завершить аудит"
            description={
              auditRun?.errorMessage ??
              'Проверьте подключение Ozon и попробуйте запустить аудит повторно'
            }
          />
        </Card>
      )}

      {showReport && (
        <>
          {latestQuery.isLoading ? (
            <LoadingState message="Загрузка результатов аудита…" />
          ) : latestQuery.error ? (
            <ErrorState message={getHumanError(latestQuery.error)} />
          ) : latestQuery.data?.empty ? (
            <Card>
              <EmptyState
                title="Отчёт ещё не готов"
                description={latestQuery.data.message ?? 'Дождитесь завершения аудита'}
              />
            </Card>
          ) : (
            <>
              <div className={styles.grid}>
                <div className={styles.stat}>
                  <strong>{summary?.totalIssues ?? auditRun?.issuesCount ?? topIssues.length}</strong>
                  <span>Найдено проблем</span>
                </div>
                <div className={styles.stat}>
                  <strong>{summary?.criticalIssues ?? auditRun?.criticalIssuesCount ?? 0}</strong>
                  <span>Критичных</span>
                </div>
                <div className={styles.stat}>
                  <strong>{summary?.highIssues ?? auditRun?.highIssuesCount ?? 0}</strong>
                  <span>Высоких</span>
                </div>
                <div className={styles.stat}>
                  <strong className={styles.statCompact}>
                    {formatLossRange(
                      summary?.estimatedLossMin ?? auditRun?.estimatedLossMin,
                      summary?.estimatedLossMax ?? auditRun?.estimatedLossMax,
                    )}
                  </strong>
                  <span>Оценка потерь</span>
                  {(summary?.lossCalculationConfidence ?? auditRun?.lossCalculationConfidence) ===
                    'LOW' && (
                    <span className={`${styles.muted} ${styles.statHint}`}>
                      низкая уверенность
                    </span>
                  )}
                </div>
                {(auditRun?.dataQualityScore ?? dataQuality?.score) !== undefined && (
                  <div className={styles.stat}>
                    <strong>{auditRun?.dataQualityScore ?? dataQuality?.score}/100</strong>
                    <span>Качество данных</span>
                  </div>
                )}
              </div>

              {dataQuality && (
                <AuditDataQualityCard
                  dataQuality={dataQuality}
                  showPartialWarning={auditState === 'PARTIAL_DATA'}
                />
              )}

              {latestQuery.data?.report && (
                <Card title="Последний AI-отчёт">
                  <div className={`${styles.summaryRow} ${styles.mbMd}`}>
                    <p>
                      <strong>Период:</strong>{' '}
                      {formatDate(auditRun?.periodFrom ?? latestQuery.data.report.createdAt)} —{' '}
                      {formatDate(auditRun?.periodTo ?? latestQuery.data.report.createdAt)}
                    </p>
                  </div>
                  <pre className={styles.preText}>
                    {latestQuery.data.report.aiText}
                  </pre>
                  <p className={styles.muted}>
                    Создан: {formatDate(latestQuery.data.report.createdAt)}
                  </p>
                </Card>
              )}

              <h2 className={styles.sectionTitle}>Главные проблемы</h2>

              {!topIssues.length ? (
                <EmptyState
                  title="Активных проблем не найдено"
                  description="Либо потери не обнаружены, либо данных недостаточно для детекторов"
                />
              ) : (
                topIssues.map((issue) => <ProfitAuditIssueCard key={issue.id} issue={issue} />)
              )}

              <h2 className={styles.sectionTitle}>Рекомендации</h2>

              {!topRecommendations.length ? (
                <EmptyState title="Активных рекомендаций нет" />
              ) : (
                topRecommendations.map((rec) => (
                  <ProfitAuditRecommendationCard key={rec.id} recommendation={rec} />
                ))
              )}
            </>
          )}
        </>
      )}

      <p className={`${styles.muted} ${styles.mtLg}`}>
        <Link to={`/ozon/connections/${selectedConnection.id}/audit`} className={styles.link}>
          Журнал compliance →
        </Link>
      </p>
    </div>
  );
}
