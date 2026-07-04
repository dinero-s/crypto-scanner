import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminAuditLogs } from '../../api/admin/adminApi';
import { Card, PageHeader, Button } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'audit', page],
    queryFn: () => getAdminAuditLogs({ page, limit: 20 }),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader title="Журнал аудита" subtitle="Кто что сделал в панели администратора" />
      <Card>
        <p className={styles.infoBox}>
          Журнал аудита отвечает на вопрос «кто что сделал». Логи соответствия — «какой внешний
          запрос был разрешён или заблокирован».
        </p>
      </Card>

      {!data?.data.length ? (
        <EmptyState title="Журнал аудита пуст" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Исполнитель</th>
                  <th>Роль</th>
                  <th>Действие</th>
                  <th>Сущность</th>
                  <th>Сообщение</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.actorEmail}</td>
                    <td>{row.actorRole}</td>
                    <td>
                      <Link className={styles.link} to={`/admin/audit/${row.id}`}>
                        {row.action}
                      </Link>
                    </td>
                    <td>
                      {row.entityType} {row.entityId ?? ''}
                    </td>
                    <td>{row.message}</td>
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
