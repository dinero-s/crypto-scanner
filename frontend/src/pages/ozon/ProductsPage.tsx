import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../api/ozon/ozonApi';
import { AvailabilityBadge } from '../../components/ui/AvailabilityBadge';
import { Button, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { OzonProduct } from '../../types/ozon';
import { formatDate, formatPrice, getHumanError, isUnavailableStatus } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

const PAGE_SIZE = 50;

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);
  const [noStock, setNoStock] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'stock' | 'updatedAt'>('updatedAt');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ozon', 'products', page, debouncedSearch, noStock, hasRecommendations, hasAlerts, sortBy],
    queryFn: () =>
      getProducts({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        noStock: noStock || undefined,
        hasRecommendations: hasRecommendations || undefined,
        hasAlerts: hasAlerts || undefined,
        sortBy,
        sortOrder: sortBy === 'updatedAt' ? 'desc' : 'asc',
      }),
  });

  const items = data?.items ?? [];

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader title="Товары" subtitle="Каталог продавца из официального API" />

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Поиск по названию / offerId / productId"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ flex: 1, minWidth: 200, maxWidth: 'none' }}
        />
        <label>
          <input
            type="checkbox"
            checked={hasRecommendations}
            onChange={(e) => {
              setHasRecommendations(e.target.checked);
              setPage(1);
            }}
          />
          Есть рекомендации
        </label>
        <label>
          <input
            type="checkbox"
            checked={hasAlerts}
            onChange={(e) => {
              setHasAlerts(e.target.checked);
              setPage(1);
            }}
          />
          Есть alerts
        </label>
        <label>
          <input
            type="checkbox"
            checked={noStock}
            onChange={(e) => {
              setNoStock(e.target.checked);
              setPage(1);
            }}
          />
          Нет остатков
        </label>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as typeof sortBy);
            setPage(1);
          }}
        >
          <option value="updatedAt">По дате обновления</option>
          <option value="price">По цене</option>
          <option value="stock">По остаткам</option>
        </select>
      </div>

      {!items.length ? (
        <EmptyState title="Товары не найдены" description="Измените фильтры или выполните синхронизацию" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Product ID</th>
                  <th>Offer ID</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th>Мин. цена конкурента</th>
                  <th>Availability</th>
                  <th>Рекомендации</th>
                  <th>Обновление</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p: OzonProduct) => (
                  <tr key={p.productId}>
                    <td>
                      <Link to={`/ozon/products/${p.productId}`} className={styles.link}>
                        {p.title ?? '—'}
                      </Link>
                    </td>
                    <td>{p.productId}</td>
                    <td>{p.offerId ?? '—'}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{p.stockPresent ?? 0}</td>
                    <td>
                      {isUnavailableStatus(p.availabilityStatus) ? (
                        <AvailabilityBadge status="NOT_AVAILABLE_VIA_OFFICIAL_API" />
                      ) : (
                        formatPrice(p.minCompetitorPrice)
                      )}
                    </td>
                    <td>
                      <AvailabilityBadge status={p.availabilityStatus ?? 'AVAILABLE'} />
                    </td>
                    <td>{p.recommendationsCount ?? 0}</td>
                    <td>{formatDate(p.lastSyncedAt ?? p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.filters} style={{ marginTop: 16 }}>
            <span>
              Показано {items.length} из {data?.total ?? 0}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Назад
              </Button>
              <span>
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Вперёд
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
