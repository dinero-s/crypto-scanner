import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminAuditLogById } from '../../api/admin/adminApi';
import { Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/format';
import styles from '../../components/ui/Page.module.css';

export function AdminAuditDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'audit', id],
    queryFn: () => getAdminAuditLogById(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Запись аудита не найдена" />;

  return (
    <div>
      <PageHeader
        title={data.action}
        subtitle={formatDate(data.createdAt)}
        actions={<Link className={styles.link} to="/admin/audit">← Журнал аудита</Link>}
      />
      <Card>
        <p>Исполнитель: {data.actorEmail}</p>
        <p>Тип: {data.entityType}</p>
        <p>
          Объект: {data.entityId ?? '—'}
        </p>
        <p>Статус: {data.status ?? '—'}</p>
        <p>Результат: {data.executionResult ?? '—'}</p>
        <p>Описание: {data.message}</p>
        {data.reason && <p>Причина: {data.reason}</p>}
      </Card>
    </div>
  );
}
