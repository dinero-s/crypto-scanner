import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  deleteAdminConnection,
  getAdminConnections,
  pauseAdminConnection,
  resumeAdminConnection,
  runAdminConnectionHealth,
  runAdminConnectionSync,
} from '../../api/admin/adminApi';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { canAdminManageConnections } from '../../components/admin/adminPermissions';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import { translateConnectionAction } from './adminRu';
import styles from '../../components/ui/Page.module.css';

type ConfirmAction = 'health' | 'sync' | 'pause' | 'resume' | 'delete';

export function AdminConnectionsPage() {
  const { role } = useAdminAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [confirm, setConfirm] = useState<{ id: string; action: ConfirmAction } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'connections', page, debouncedSearch],
    queryFn: () =>
      getAdminConnections({ page, limit: 20, search: debouncedSearch || undefined }),
  });

  const actionMut = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: ConfirmAction }) => {
      switch (action) {
        case 'health':
          return runAdminConnectionHealth(id);
        case 'sync':
          return runAdminConnectionSync(id);
        case 'pause':
          return pauseAdminConnection(id);
        case 'resume':
          return resumeAdminConnection(id);
        case 'delete':
          return deleteAdminConnection(id);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'connections'] });
      setConfirm(null);
    },
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader title="Подключения" subtitle="Подключения к маркетплейсу Ozon" />
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Поиск по названию"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {!data?.data.length ? (
        <EmptyState title="Подключения не найдены" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Название</th>
                  <th>Статус</th>
                  <th>Здоровье</th>
                  <th>Последняя синхр.</th>
                  <th>Товары</th>
                  <th>Ошибки</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr key={item.id}>
                    <td>{item.userEmail}</td>
                    <td>
                      <Link className={styles.link} to={`/admin/connections/${item.id}`}>
                        {item.connectionName}
                      </Link>
                    </td>
                    <td>
                      <AdminStatusBadge status={item.status} />
                    </td>
                    <td>
                      <AdminStatusBadge status={item.healthStatus} />
                    </td>
                    <td>{item.lastSyncAt ? formatDate(item.lastSyncAt) : '—'}</td>
                    <td>{item.productsCount}</td>
                    <td>{item.errorsCount}</td>
                    <td>
                      <div className={styles.actionsCell}>
                        <Link className={styles.link} to={`/admin/connections/${item.id}`}>
                          Открыть
                        </Link>
                        {canAdminManageConnections(role) && (
                          <>
                            <Button onClick={() => setConfirm({ id: item.id, action: 'health' })}>
                              Проверка
                            </Button>
                            <Button onClick={() => setConfirm({ id: item.id, action: 'sync' })}>
                              Синхр.
                            </Button>
                            <Button onClick={() => setConfirm({ id: item.id, action: 'pause' })}>
                              Пауза
                            </Button>
                            <Button onClick={() => setConfirm({ id: item.id, action: 'resume' })}>
                              Возобновить
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => setConfirm({ id: item.id, action: 'delete' })}
                            >
                              Удалить
                            </Button>
                          </>
                        )}
                      </div>
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

      <AdminConfirmModal
        open={Boolean(confirm)}
        title="Подтвердите действие"
        message={`Выполнить ${confirm ? translateConnectionAction(confirm.action) : ''} для подключения?`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && actionMut.mutate(confirm)}
        loading={actionMut.isPending}
      />
    </div>
  );
}
