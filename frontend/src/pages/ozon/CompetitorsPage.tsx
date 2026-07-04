import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  createCompetitor,
  deleteCompetitor,
  getCompetitorSnapshots,
  getCompetitors,
  getConnections,
  syncAllCompetitors,
  syncCompetitor,
} from '../../api/ozon/ozonApi';
import { AvailabilityBadge } from '../../components/ui/AvailabilityBadge';
import { LegalNotice } from '../../components/ui/LegalNotice';
import { Badge, Button, Card, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import {
  addCompetitorSchema,
  type AddCompetitorFormValues,
} from '../../schemas/competitor.schema';
import type { OzonCompetitor } from '../../types/ozon';
import {
  URL_VALIDATION_MESSAGE,
  formatDate,
  formatPrice,
  getHumanError,
  isUnavailableStatus,
  isUrlValidationError,
} from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

function competitorTitle(c: OzonCompetitor): string {
  return c.name ?? c.title ?? c.sku ?? c.externalProductId ?? c.url ?? 'Конкурент';
}

function CompetitorSnapshots({ competitorId }: { competitorId: string }) {
  const snapshots = useQuery({
    queryKey: ['ozon', 'competitors', competitorId, 'snapshots'],
    queryFn: () => getCompetitorSnapshots(competitorId, 10),
  });

  if (snapshots.isLoading) return <p className={styles.textSecondary}>Загрузка истории…</p>;
  if (snapshots.error) {
    return <ErrorState message={getHumanError(snapshots.error)} />;
  }
  if (!snapshots.data?.items.length) {
    return <p className={styles.textSecondary}>Снимков пока нет</p>;
  }

  return (
    <ul className={styles.listPlain}>
      {snapshots.data.items.map((snap) => (
        <li key={snap.id ?? `${snap.date ?? snap.collectedAt}`}>
          {formatDate(snap.date ?? snap.collectedAt)} — цена {formatPrice(snap.price)}
          {snap.rating !== undefined ? `, рейтинг ${String(snap.rating)}` : ''}
          {snap.availability ? `, ${snap.availability}` : ''}
        </li>
      ))}
    </ul>
  );
}

function CompetitorCard({
  competitor,
  onSync,
  onDelete,
  syncing,
  deleting,
}: {
  competitor: OzonCompetitor;
  onSync: () => void;
  onDelete: () => void;
  syncing: boolean;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const unavailable = isUnavailableStatus(competitor.availabilityStatus ?? competitor.status);

  return (
    <Card title={competitorTitle(competitor)}>
      {(competitor.url ?? competitor.urlReference) && (
        <p>
          URL:{' '}
          <span className={styles.wordBreak}>
            {competitor.url ?? competitor.urlReference}
          </span>
        </p>
      )}
      <p>
        Статус: <Badge tone="neutral">{competitor.status}</Badge>
      </p>
      <p>
        Цена:{' '}
        {unavailable && competitor.lastPrice === undefined ? (
          <AvailabilityBadge status="NOT_AVAILABLE_VIA_OFFICIAL_API" showMessage />
        ) : (
          formatPrice(competitor.lastPrice ?? competitor.price)
        )}
      </p>
      {(competitor.lastRating !== undefined || competitor.lastReviewsCount !== undefined) && (
        <p>
          Рейтинг: {competitor.lastRating ?? competitor.rating ?? '—'} / отзывы:{' '}
          {competitor.lastReviewsCount ?? competitor.reviewsCount ?? '—'}
        </p>
      )}
      {competitor.lastAvailability && (
        <p>Наличие: {competitor.lastAvailability}</p>
      )}
      {competitor.lastSyncedAt && (
        <p className={styles.textSecondary}>
          Обновлено: {formatDate(competitor.lastSyncedAt)}
        </p>
      )}
      {competitor.lastError && (
        <p className={styles.textWarning}>{competitor.lastError}</p>
      )}
      <div className={`${styles.actions} ${styles.mtMd}`}>
        <Button variant="secondary" disabled={syncing} onClick={onSync}>
          Синхронизировать
        </Button>
        <Button variant="secondary" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Скрыть историю' : 'История'}
        </Button>
        <Button variant="danger" disabled={deleting} onClick={onDelete}>
          Удалить
        </Button>
      </div>
      {expanded && <CompetitorSnapshots competitorId={competitor.id} />}
    </Card>
  );
}

export function CompetitorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const connections = useQuery({ queryKey: ['ozon', 'connections'], queryFn: getConnections });
  const competitors = useQuery({ queryKey: ['ozon', 'competitors'], queryFn: getCompetitors });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCompetitorFormValues>({
    resolver: zodResolver(addCompetitorSchema),
    defaultValues: { connectionId: '', url: '' },
  });

  const createMut = useMutation({
    mutationFn: createCompetitor,
    onSuccess: () => {
      setShowForm(false);
      reset({ connectionId: connections.data?.[0]?.id ?? '', url: '' });
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['ozon', 'competitors'] });
    },
    onError: (e) => {
      const msg = getHumanError(e);
      setFormError(isUrlValidationError(msg) ? URL_VALIDATION_MESSAGE : msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteCompetitor,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ozon', 'competitors'] }),
  });

  const syncMut = useMutation({
    mutationFn: syncCompetitor,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ozon', 'competitors'] }),
  });

  const syncAllMut = useMutation({
    mutationFn: () => syncAllCompetitors(connections.data?.[0]?.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ozon', 'competitors'] }),
  });

  const onSubmit = (values: AddCompetitorFormValues) => {
    setFormError(null);
    createMut.mutate({
      connectionId: values.connectionId,
      url: values.url.trim(),
    });
  };

  const defaultConnectionId = connections.data?.[0]?.id ?? '';

  useEffect(() => {
    if (defaultConnectionId) {
      reset({ connectionId: defaultConnectionId, url: '' });
    }
  }, [defaultConnectionId, reset]);

  if (connections.isLoading || competitors.isLoading) return <LoadingState />;
  if (connections.error || competitors.error) {
    return <ErrorState message={getHumanError(connections.error ?? competitors.error)} />;
  }

  return (
    <div>
      <PageHeader
        title="Конкуренты"
        subtitle="Мониторинг карточек Ozon только через backend и официальные API"
        actions={
          <>
            <Button
              variant="secondary"
              disabled={syncAllMut.isPending || !competitors.data?.length}
              onClick={() => syncAllMut.mutate()}
            >
              Синхронизировать все
            </Button>
            <Button onClick={() => setShowForm((v) => !v)}>Добавить карточку</Button>
          </>
        }
      />

      <LegalNotice />

      {showForm && (
        <Card title="Добавление карточки конкурента">
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.field}>
              <label htmlFor="connectionId">Подключение</label>
              <select id="connectionId" {...register('connectionId')}>
                {(connections.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.sellerName}
                  </option>
                ))}
              </select>
              {errors.connectionId && (
                <small className={styles.fieldError}>{errors.connectionId.message}</small>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="url">URL карточки Ozon</label>
              <input
                id="url"
                placeholder="https://www.ozon.ru/product/…"
                {...register('url')}
              />
              {errors.url && (
                <small className={styles.fieldError}>{errors.url.message}</small>
              )}
              <small className={styles.fieldHint}>
                Ссылка передаётся только на backend. Парсинг витрины не используется.
              </small>
            </div>
            {formError && <ErrorState message={formError} />}
            <Button type="submit" disabled={createMut.isPending}>
              Добавить товар
            </Button>
          </form>
        </Card>
      )}

      {!competitors.data?.length ? (
        <EmptyState title="Конкуренты не отслеживаются" />
      ) : (
        competitors.data.map((c) => (
          <CompetitorCard
            key={c.id}
            competitor={c}
            syncing={syncMut.isPending}
            deleting={deleteMut.isPending}
            onSync={() => syncMut.mutate(c.id)}
            onDelete={() => deleteMut.mutate(c.id)}
          />
        ))
      )}
    </div>
  );
}
