import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  cancelAdminJob,
  getAdminJobs,
  retryAdminJob,
} from '../../api/admin/adminApi';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { canAdminManageConnections } from '../../components/admin/adminPermissions';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import { translateJobAction } from './adminRu';
import styles from '../../components/ui/Page.module.css';

export function AdminJobsPage() {
  const { role } = useAdminAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ id: string; action: 'retry' | 'cancel' } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'jobs', page],
    queryFn: () => getAdminJobs({ page, limit: 20 }),
  });

  const actionMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'retry' | 'cancel' }) =>
      action === 'retry' ? retryAdminJob(id) : cancelAdminJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      setConfirm(null);
    },
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader title="Задачи синхронизации" subtitle="Диагностика задач BullMQ" />
      {!data?.data.length ? (
        <EmptyState title="Задачи не найдены" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Задача</th>
                  <th>Пользователь</th>
                  <th>Подключение</th>
                  <th>Статус</th>
                  <th>Попытки</th>
                  <th>Начало</th>
                  <th>Ошибка</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <Link className={styles.link} to={`/admin/jobs/${job.id}`}>
                        {job.jobType}
                      </Link>
                    </td>
                    <td>{job.userEmail}</td>
                    <td>{job.connectionName ?? '—'}</td>
                    <td>
                      <AdminStatusBadge status={job.status} />
                    </td>
                    <td>
                      {job.attemptsMade}/{job.maxAttempts}
                    </td>
                    <td>{job.startedAt ? formatDate(job.startedAt) : '—'}</td>
                    <td>{job.errorMessage ?? '—'}</td>
                    <td>
                      <div className={styles.actionsCell}>
                        {canAdminManageConnections(role) && job.status === 'FAILED' && (
                          <Button onClick={() => setConfirm({ id: job.id, action: 'retry' })}>
                            Повторить
                          </Button>
                        )}
                        {canAdminManageConnections(role) &&
                          (job.status === 'WAITING' || job.status === 'DELAYED') && (
                            <Button
                              variant="danger"
                              onClick={() => setConfirm({ id: job.id, action: 'cancel' })}
                            >
                              Отменить
                            </Button>
                          )}
                        {job.connectionId && (
                          <Link className={styles.link} to={`/admin/connections/${job.connectionId}`}>
                            Подключение
                          </Link>
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
        title="Подтвердите действие с задачей"
        message={`Выполнить ${confirm ? translateJobAction(confirm.action) : ''}?`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && actionMut.mutate(confirm)}
        loading={actionMut.isPending}
      />
    </div>
  );
}
