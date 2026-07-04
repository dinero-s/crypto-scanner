import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getProductAnalytics } from '../../api/ozon/ozonApi';
import { AvailabilityBadge } from '../../components/ui/AvailabilityBadge';
import { Badge, Card, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, formatPrice, getHumanError, isUnavailableStatus } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['ozon', 'product', id],
    queryFn: () => getProductAnalytics(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  const product = data?.product;

  return (
    <div>
      <PageHeader
        title={product?.title ?? `Товар ${id}`}
        subtitle="Детали из официального API"
      />

      <Card title="Карточка товара">
        {!product ? (
          <EmptyState title="Товар не найден" />
        ) : (
          <>
            <p>Product ID: {product.productId}</p>
            <p>Offer ID: {product.offerId ?? '—'}</p>
            <p>Цена: {formatPrice(product.price)}</p>
            <p>Остаток: {product.stockPresent ?? 0}</p>
            <p>Обновлено: {formatDate(product.lastSyncedAt ?? product.updatedAt)}</p>
            <AvailabilityBadge status={data?.availabilityStatus ?? product.availabilityStatus} showMessage />
          </>
        )}
      </Card>

      {data?.salesData && Object.keys(data.salesData).length > 0 && (
        <Card title="Заказы / продажи">
          <pre style={{ fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(data.salesData, null, 2)}
          </pre>
        </Card>
      )}

      <Card title="Конкуренты">
        {!data?.competitors?.length ? (
          <EmptyState title="Конкуренты не добавлены" />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Цена</th>
                <th>Рейтинг</th>
                <th>Отзывы</th>
                <th>Доступность</th>
              </tr>
            </thead>
            <tbody>
              {data.competitors.map((c) => (
                <tr key={c.id}>
                  <td>{c.title ?? c.productId ?? '—'}</td>
                  <td>
                    {isUnavailableStatus(c.availabilityStatus ?? c.status) ? (
                      <AvailabilityBadge status="NOT_AVAILABLE_VIA_OFFICIAL_API" showMessage />
                    ) : (
                      formatPrice(c.price)
                    )}
                  </td>
                  <td>{c.rating ?? '—'}</td>
                  <td>{c.reviewsCount ?? '—'}</td>
                  <td>
                    <AvailabilityBadge status={c.availabilityStatus ?? c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Snapshots">
        {!data?.snapshots?.length ? (
          <EmptyState title="Snapshots пока нет" />
        ) : (
          data.snapshots.slice(0, 5).map((s, i) => (
            <pre key={i} style={{ fontSize: 11, marginBottom: 8 }}>
              {JSON.stringify(s, null, 2)}
            </pre>
          ))
        )}
      </Card>

      <Card title="Alerts">
        {!data?.alerts?.length ? (
          <EmptyState title="Alerts нет" />
        ) : (
          data.alerts.map((a) => (
            <div key={a.id} style={{ marginBottom: 8 }}>
              {a.message}{' '}
              <Badge tone={a.status === 'failed' ? 'danger' : 'neutral'}>
                {String(a.status).toUpperCase()}
              </Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
