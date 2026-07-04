import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminAlerts } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Button, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function AdminAlertsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'alerts', page],
    queryFn: () => getAdminAlerts({ page, limit: 20 }),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader title="Оповещения" subtitle="Уведомления по Email и Telegram" />
      {!data?.data.length ? (
        <EmptyState title="Оповещения не найдены" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Пользователь</th>
                  <th>Канал</th>
                  <th>Статус</th>
                  <th>Важность</th>
                  <th>Сообщение</th>
                  <th>Ошибка</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.userEmail}</td>
                    <td>{row.channel}</td>
                    <td>
                      <AdminStatusBadge status={row.status} />
                    </td>
                    <td>{row.severity}</td>
                    <td>
                      <Link className={styles.link} to={`/admin/alerts/${row.id}`}>
                        {row.message}
                      </Link>
                    </td>
                    <td>{row.errorMessage ?? '—'}</td>
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
