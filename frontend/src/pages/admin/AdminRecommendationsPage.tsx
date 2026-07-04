import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminRecommendations } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Button, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function AdminRecommendationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'recommendations', page],
    queryFn: () => getAdminRecommendations({ page, limit: 20 }),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader title="Рекомендации" subtitle="AI- и rule-based рекомендации для продавцов" />
      {!data?.data.length ? (
        <EmptyState title="Рекомендации не найдены" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Пользователь</th>
                  <th>Товар</th>
                  <th>Тип</th>
                  <th>Важность</th>
                  <th>Статус</th>
                  <th>Доступность</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.userEmail}</td>
                    <td>
                      <Link className={styles.link} to={`/admin/recommendations/${row.id}`}>
                        {row.productName ?? row.productId ?? row.title}
                      </Link>
                    </td>
                    <td>{row.type}</td>
                    <td>{row.severity}</td>
                    <td>
                      <AdminStatusBadge status={row.status} />
                    </td>
                    <td>
                      <AdminStatusBadge status={row.availabilityStatus} />
                    </td>
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
