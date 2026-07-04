import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminJobById } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { getHumanError } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function AdminJobDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'jobs', id],
    queryFn: () => getAdminJobById(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Задача не найдена" />;

  return (
    <div>
      <PageHeader
        title={data.jobType}
        subtitle={data.id}
        actions={<Link className={styles.link} to="/admin/jobs">← Задачи</Link>}
      />
      <Card title="Метаданные">
        <p>
          Статус: <AdminStatusBadge status={data.status} />
        </p>
        <p>Пользователь: {data.userEmail}</p>
        <p>Подключение: {data.connectionName ?? '—'}</p>
        <p>
          Попытки: {data.attemptsMade}/{data.maxAttempts}
        </p>
        <p>Ошибка: {data.errorMessage ?? '—'}</p>
      </Card>
      <Card title="Очищенные данные задачи">
        <pre>{JSON.stringify(data.sanitizedData ?? {}, null, 2)}</pre>
      </Card>
    </div>
  );
}
