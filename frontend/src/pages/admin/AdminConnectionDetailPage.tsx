import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminConnectionById } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function AdminConnectionDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'connections', id],
    queryFn: () => getAdminConnectionById(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Подключение не найдено" />;

  return (
    <div>
      <PageHeader
        title={data.connectionName}
        subtitle={`Client-Id: ${data.maskedClientId}`}
        actions={<Link className={styles.link} to="/admin/connections">← Подключения</Link>}
      />

      <Card title="Информация о подключении">
        <p>Маркетплейс: {data.marketplace}</p>
        <p>
          Статус: <AdminStatusBadge status={data.status} />
        </p>
        <p>
          Здоровье: <AdminStatusBadge status={data.healthStatus} />
        </p>
        <p>Последняя синхронизация: {data.lastSyncAt ? formatDate(data.lastSyncAt) : '—'}</p>
      </Card>

      <Card title="Пользователь">
        <p>{data.user.email}</p>
        <p>{data.user.name}</p>
      </Card>

      <Card title="Сводка синхронизации">
        <p>Товары: {data.productsCount}</p>
        <p>Конкуренты: {data.competitorsCount}</p>
        <p>Рекомендации: {data.recommendationsCount}</p>
        <p>Оповещения: {data.alertsCount}</p>
        <p>Ошибки: {data.errorsCount}</p>
      </Card>
    </div>
  );
}
