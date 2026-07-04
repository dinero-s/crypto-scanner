import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  fetchArbitrageStats,
  fetchDashboard,
  fetchScannerHealth,
  fetchTopOpportunities,
} from '../api/dashboardApi';
import { TopOpportunityCard } from '../components/opportunities/TopOpportunityCard';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { SkeletonCardGrid, SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState, RiskDisclaimer } from '../components/ui/StateBlocks';
import { formatPercent, formatTimestamp } from '../utils/format';
import { getHumanError } from '../../utils/format';
import styles from './HomePage.module.css';

export function MiniAppHomePage() {
  const navigate = useNavigate();

  const dashboardQuery = useQuery({
    queryKey: ['mini-app', 'dashboard'],
    queryFn: fetchDashboard,
  });

  const statsQuery = useQuery({
    queryKey: ['mini-app', 'stats'],
    queryFn: fetchArbitrageStats,
  });

  const healthQuery = useQuery({
    queryKey: ['mini-app', 'health'],
    queryFn: fetchScannerHealth,
  });

  const topQuery = useQuery({
    queryKey: ['mini-app', 'top', 3],
    queryFn: () => fetchTopOpportunities(3),
  });

  const isLoading =
    dashboardQuery.isLoading || statsQuery.isLoading || healthQuery.isLoading || topQuery.isLoading;

  const error =
    dashboardQuery.error ?? statsQuery.error ?? healthQuery.error ?? topQuery.error;

  const refetchAll = async () => {
    await Promise.all([
      dashboardQuery.refetch(),
      statsQuery.refetch(),
      healthQuery.refetch(),
      topQuery.refetch(),
    ]);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <SkeletonCardGrid count={4} />
        <SkeletonTableRows count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState message={getHumanError(error)} onRetry={() => void refetchAll()} />
    );
  }

  const dashboard = dashboardQuery.data;
  const stats = statsQuery.data;
  const health = healthQuery.data;
  const top = topQuery.data ?? [];
  const totalOpportunities = (dashboard?.fundingCount ?? 0) + (dashboard?.cashCarryCount ?? 0);
  const collectors = health?.collectors.collectors ?? {};

  return (
    <PullToRefresh onRefresh={refetchAll}>
      <div className={styles.page}>
        <RiskDisclaimer />

        <div className={styles.grid}>
          <Card
            title="Возможности"
            value={String(totalOpportunities)}
            subtitle="найдено сканером"
          />
          <Card
            title="Max net yield"
            value={formatPercent(stats?.maxNetYieldPercent ?? 0)}
            subtitle="теоретический максимум"
          />
          <Card
            title="Funding"
            value={String(dashboard?.fundingCount ?? 0)}
            subtitle="активных"
          />
          <Card
            title="Cash & Carry"
            value={String(dashboard?.cashCarryCount ?? 0)}
            subtitle="активных"
          />
        </div>

        <Card title="Статус рынка">
          <p className={styles.sectionTitle} style={{ marginTop: 0 }}>
            Обновлено: {formatTimestamp(dashboard?.lastUpdatedAt ?? stats?.lastCalculatedAt)}
          </p>
          <Badge variant={dashboard?.collectorsHealthy ? 'success' : 'danger'}>
            Collectors {dashboard?.collectorsHealthy ? 'healthy' : 'degraded'}
          </Badge>
        </Card>

        <Card title="Collectors">
          <div className={styles.collectorList}>
            {Object.entries(collectors).length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--ma-text-muted)', margin: 0 }}>
                Нет данных о коллекторах
              </p>
            ) : (
              Object.entries(collectors).map(([name, state]) => (
                <div key={name} className={styles.collectorItem}>
                  <span>
                    <span
                      className={`${styles.statusDot} ${state.healthy ? styles.healthy : styles.unhealthy}`}
                    />
                    {name}
                  </span>
                  <span style={{ color: 'var(--ma-text-muted)' }}>
                    {formatTimestamp(new Date(state.lastRunAt).getTime())}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <h2 className={styles.sectionTitle}>Top 3 opportunities</h2>
        {top.length === 0 ? (
          <EmptyState
            title="Нет возможностей"
            description="Сканер пока не нашёл подходящих арбитражных связок. Попробуйте обновить позже."
          />
        ) : (
          top.map((item, index) => (
            <TopOpportunityCard key={item.id} item={item} rank={index + 1} />
          ))
        )}

        <div className={styles.quickLinks}>
          <button type="button" className={styles.quickLink} onClick={() => navigate('/mini-app/funding')}>
            Funding
            <span>{String(dashboard?.fundingCount ?? 0)} возможностей</span>
          </button>
          <button
            type="button"
            className={styles.quickLink}
            onClick={() => navigate('/mini-app/cash-carry')}
          >
            Cash & Carry
            <span>{String(dashboard?.cashCarryCount ?? 0)} возможностей</span>
          </button>
        </div>
      </div>
    </PullToRefresh>
  );
}
