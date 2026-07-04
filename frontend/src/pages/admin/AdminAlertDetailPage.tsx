import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminAlertById } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function AdminAlertDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'alerts', id],
    queryFn: () => getAdminAlertById(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Оповещение не найдено" />;

  return (
    <div>
      <PageHeader
        title="Детали оповещения"
        subtitle={formatDate(data.createdAt)}
        actions={<Link className={styles.link} to="/admin/alerts">← Оповещения</Link>}
      />
      <Card>
        <p>
          Статус: <AdminStatusBadge status={data.status} />
        </p>
        <p>Канал: {data.channel}</p>
        <p>Сообщение: {data.message}</p>
        <p>Ошибка: {data.errorMessage ?? '—'}</p>
      </Card>
    </div>
  );
}
