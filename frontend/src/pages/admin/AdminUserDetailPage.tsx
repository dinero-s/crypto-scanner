import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminUserById } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
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
        <p>Регистрация: {data.createdAt ? formatDate(data.createdAt) : '—'}</p>
        <p>Последний вход: {data.lastLoginAt ? formatDate(data.lastLoginAt) : '—'}</p>
      </Card>

      <Card title="Подключения к маркетплейсам">
        {!data.marketplaceConnections.length ? (
          <p>Нет подключений</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Статус</th>
                  <th>Последняя синхр.</th>
                </tr>
              </thead>
              <tbody>
                {data.marketplaceConnections.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className={styles.link} to={`/admin/connections/${c.id}`}>
                        {c.name}
                      </Link>
                    </td>
                    <td>
                      <AdminStatusBadge status={c.status} />
                    </td>
                    <td>{c.lastSyncAt ? formatDate(c.lastSyncAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
