import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminComplianceLogs } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Card, PageHeader } from '../../components/ui/Page';
import { Button } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import { yesNo } from './adminRu';
import styles from '../../components/ui/Page.module.css';

export function AdminCompliancePage() {
  const [page, setPage] = useState(1);
  const [blockedOnly, setBlockedOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'compliance', page, blockedOnly],
    queryFn: () =>
      getAdminComplianceLogs({ page, limit: 20, blockedOnly: blockedOnly || undefined }),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader
        title="Логи соответствия"
        subtitle="Аудит внешних запросов по принципу legal-by-design"
      />
      <Card>
        <p className={styles.infoBox}>
          Логи соответствия показывают, какие внешние запросы были разрешены или заблокированы.
          Это подтверждает, что проект работает по принципу legal-by-design и не использует
          запрещённые источники данных.
        </p>
      </Card>

      {data?.summary && (
        <Card title="Сводка за 24 ч">
          <div className={styles.summaryRow}>
            <p>Заблокировано: {data.summary.blockedLast24h}</p>
            <p>Разрешено: {data.summary.allowedLast24h}</p>
          </div>
        </Card>
      )}

      <div className={styles.filters}>
        <label>
          <input
            type="checkbox"
            checked={blockedOnly}
            onChange={(e) => {
              setBlockedOnly(e.target.checked);
              setPage(1);
            }}
          />
          Только заблокированные
        </label>
      </div>

      {!data?.data.length ? (
        <EmptyState title="Логи соответствия пусты" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Пользователь</th>
                  <th>Действие</th>
                  <th>Хост</th>
                  <th>Решение</th>
                  <th>Заблокирован</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id} className={row.blocked ? styles.rowHighlight : undefined}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.userEmail || '—'}</td>
                    <td>
                      <Link className={styles.link} to={`/admin/compliance/${row.id}`}>
                        {row.action}
                      </Link>
                    </td>
                    <td>{row.requestHost ?? '—'}</td>
                    <td>
                      <AdminStatusBadge status={row.decision} />
                    </td>
                    <td>{yesNo(row.blocked)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Назад
            </Button>
            <span>
              {page} / {data.totalPages}
            </span>
            <Button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Вперёд
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
