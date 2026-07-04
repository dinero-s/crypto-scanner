import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  blockAdminUser,
  getAdminUsers,
  unblockAdminUser,
} from '../../api/admin/adminApi';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import {
  canAdminBlockUsers,
  canAdminWrite,
} from '../../components/admin/adminPermissions';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/format';
import styles from '../../components/ui/Page.module.css';

export function AdminUsersPage() {
  const { role } = useAdminAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [confirm, setConfirm] = useState<{ id: string; action: 'block' | 'unblock' } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', page, debouncedSearch],
    queryFn: () => getAdminUsers({ page, limit: 20, search: debouncedSearch || undefined }),
  });

  const blockMut = useMutation({
    mutationFn: ({ id }: { id: string }) => blockAdminUser(id, 'Admin action'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setConfirm(null);
    },
  });

  const unblockMut = useMutation({
    mutationFn: ({ id }: { id: string }) => unblockAdminUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setConfirm(null);
    },
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader title="Пользователи" subtitle="Пользователи платформы" />
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Поиск по email или имени"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {!data?.data.length ? (
        <EmptyState title="Пользователи не найдены" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Имя</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Регистрация</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.name || '—'}</td>
                    <td>{user.role}</td>
                    <td>
                      <AdminStatusBadge status={user.status} />
                    </td>
                    <td>{user.createdAt ? formatDate(user.createdAt) : '—'}</td>
                    <td>
                      <div className={styles.actionsCell}>
                        <Link className={styles.link} to={`/admin/users/${user.id}`}>
                          Открыть
                        </Link>
                        {canAdminBlockUsers(role) && user.status !== 'BLOCKED' && (
                          <Button
                            variant="danger"
                            onClick={() => setConfirm({ id: user.id, action: 'block' })}
                          >
                            Заблокировать
                          </Button>
                        )}
                        {canAdminBlockUsers(role) && user.status === 'BLOCKED' && (
                          <Button onClick={() => setConfirm({ id: user.id, action: 'unblock' })}>
                            Разблокировать
                          </Button>
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
            <Button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд
            </Button>
          </div>
        </>
      )}

      <AdminConfirmModal
        open={Boolean(confirm)}
        title={confirm?.action === 'block' ? 'Заблокировать пользователя?' : 'Разблокировать пользователя?'}
        message="Действие будет записано в журнал аудита."
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.action === 'block') {
            blockMut.mutate({ id: confirm.id });
          } else {
            unblockMut.mutate({ id: confirm.id });
          }
        }}
        loading={blockMut.isPending || unblockMut.isPending}
      />

      {!canAdminWrite(role) && (
        <p className={styles.muted}>Только чтение: действия записи отключены</p>
      )}
    </div>
  );
}
