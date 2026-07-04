import { Badge, Card } from '../../components/ui/Page';
import { AdminStatusBadge, healthTone } from '../../components/admin/AdminBadge';
import { formatDate } from '../../utils/ozon';
import { translateService, translateStatus } from './adminRu';
import type { AdminOverview } from '../../api/admin/adminTypes';
import styles from '../../components/ui/Page.module.css';

export function AdminOverviewPageContent({ data }: { data: AdminOverview }) {
  const stats = [
    ['Всего пользователей', data.totalUsers],
    ['Активных пользователей', data.activeUsers],
    ['Активных подключений Ozon', data.activeOzonConnections],
    ['Ошибочных подключений', data.failedOzonConnections],
    ['Задач синхронизации за 24 ч', data.syncJobs24h],
    ['Неудачных задач за 24 ч', data.failedSyncJobs24h],
    ['Блокировок compliance за 24 ч', data.complianceBlocks24h],
    ['Оповещений за 24 ч', data.alertsSent24h],
    ['Критических рекомендаций', data.criticalRecommendations],
  ] as const;

  return (
    <div>
      <div className={styles.grid}>
        {stats.map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <strong>{String(value)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <Card title="Последняя синхронизация">
        <p>{data.lastSyncAt ? formatDate(data.lastSyncAt) : '—'}</p>
      </Card>

      <Card title="Состояние системы">
        <div className={styles.grid}>
          {Object.entries(data.systemHealth)
            .filter(([key]) => key !== 'checkedAt')
            .map(([key, status]) => (
              <div key={key} className={styles.stat}>
                <span>{translateService(key)}</span>
                <Badge tone={healthTone(String(status) as 'OK' | 'DEGRADED' | 'DOWN' | 'UNKNOWN')}>
                  {translateStatus(String(status))}
                </Badge>
              </div>
            ))}
        </div>
      </Card>

      <Card title="Недавние неудачные задачи">
        {!data.recentFailedJobs.length ? (
          <p>Нет неудачных задач</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Задача</th>
                  <th>Ошибка</th>
                  <th>Завершено</th>
                </tr>
              </thead>
              <tbody>
                {data.recentFailedJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.jobType}</td>
                    <td>{job.errorMessage ?? '—'}</td>
                    <td>{job.finishedAt ? formatDate(job.finishedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Недавние блокировки compliance">
        {!data.recentComplianceBlocks.length ? (
          <p>Нет заблокированных запросов</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Причина</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {data.recentComplianceBlocks.map((item) => (
                  <tr key={item.id}>
                    <td>{item.endpoint ?? '—'}</td>
                    <td>{item.reason ?? '—'}</td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Недавние ошибки">
        {!data.recentErrors.length ? (
          <p>Нет ошибок</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Описание</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {data.recentErrors.map((item) => (
                  <tr key={item.id}>
                    <td>{item.summary}</td>
                    <td>
                      <AdminStatusBadge status="FAILED" />
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
