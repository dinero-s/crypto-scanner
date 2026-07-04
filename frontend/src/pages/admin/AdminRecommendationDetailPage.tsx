import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminRecommendationById } from '../../api/admin/adminApi';
import { AdminStatusBadge } from '../../components/admin/AdminBadge';
import { Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function AdminRecommendationDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'recommendations', id],
    queryFn: () => getAdminRecommendationById(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Рекомендация не найдена" />;

  return (
    <div>
      <PageHeader
        title={data.title}
        subtitle={data.userEmail}
        actions={
          <Link className={styles.link} to="/admin/recommendations">
            ← Рекомендации
          </Link>
        }
      />
      <Card title="Рекомендация">
        <p>{data.fullText ?? data.title}</p>
        <p>Причина: {data.reason}</p>
        <p>
          Доступность: <AdminStatusBadge status={data.availabilityStatus} />
        </p>
        {data.availabilityStatus === 'NOT_AVAILABLE_VIA_OFFICIAL_API' && (
          <p>
            Часть данных недоступна через официальный API маркетплейса. Система не использует
            парсинг или обход ограничений.
          </p>
        )}
        <p>Решено: {data.resolvedAt ? formatDate(data.resolvedAt) : '—'}</p>
      </Card>
    </div>
  );
}
