import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminComplianceLogById } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import { yesNo } from './adminRu';
import styles from '../../components/ui/Page.module.css';

export function AdminComplianceDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'compliance', id],
    queryFn: () => getAdminComplianceLogById(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Запись не найдена" />;

  return (
    <div>
      <PageHeader
        title={data.action}
        subtitle={formatDate(data.createdAt)}
        actions={<Link className={styles.link} to="/admin/compliance">← Логи соответствия</Link>}
      />
      <Card title="Детали">
        <p>
          Решение: <AdminStatusBadge status={data.decision} />
        </p>
        <p>Endpoint: {data.endpoint ?? '—'}</p>
        <p>Хост: {data.requestHost ?? '—'}</p>
        <p>Причина: {data.reason ?? '—'}</p>
        <p>Заблокирован: {yesNo(data.blocked)}</p>
      </Card>
    </div>
  );
}
