import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminUserById } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/format';
import { yesNo } from './adminRu';
import styles from '../../components/ui/Page.module.css';

export function AdminUserDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => getAdminUserById(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Пользователь не найден" />;

  return (
    <div>
      <PageHeader
        title={data.email}
        subtitle={data.name || 'Без имени'}
        actions={<Link className={styles.link} to="/admin/users">← Пользователи</Link>}
      />

      <Card title="Профиль">
        <p>Роль: {data.role}</p>
        <p>
          Статус: <AdminStatusBadge status={data.status} />
        </p>
        <p>Телефон: {data.phone || '—'}</p>
        <p>Город: {data.city || '—'}</p>
        <p>Email подтверждён: {yesNo(Boolean(data.isEmailConfirmed))}</p>
        <p>Регистрация: {data.createdAt ? formatDate(data.createdAt) : '—'}</p>
        <p>Последний вход: {data.lastLoginAt ? formatDate(data.lastLoginAt) : '—'}</p>
        {data.blockReason && <p>Причина блокировки: {data.blockReason}</p>}
      </Card>
    </div>
  );
}
