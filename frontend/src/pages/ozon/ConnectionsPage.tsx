import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  checkConnectionHealth,
  createConnection,
  deleteConnection,
  getConnections,
  syncConnection,
} from '../../api/ozon/ozonApi';
import { LegalNotice } from '../../components/ui/LegalNotice';
import { Badge, Button, Card, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError, mapConnectionStatus } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'success';
  if (s === 'ERROR' || s === 'INVALID') return 'danger';
  if (s === 'CHECKING') return 'info' as 'neutral';
  if (s === 'DELETED' || s === 'REVOKED') return 'neutral';
  return 'warning';
}

export function ConnectionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [sellerName, setSellerName] = useState('');
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ozon', 'connections'],
    queryFn: getConnections,
  });

  const createMut = useMutation({
    mutationFn: createConnection,
    onSuccess: () => {
      setShowForm(false);
      setSellerName('');
      setClientId('');
      setApiKey('');
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['ozon', 'connections'] });
    },
    onError: (e) => setFormError(getHumanError(e)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ozon', 'connections'] }),
  });

  const syncMut = useMutation({
    mutationFn: syncConnection,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ozon', 'connections'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMut.mutate({ sellerName, clientId, apiKey });
  };

  const handleHealthCheck = async (id: string) => {
    setCheckingId(id);
    try {
      await checkConnectionHealth(id);
      void queryClient.invalidateQueries({ queryKey: ['ozon', 'connections'] });
    } finally {
      setCheckingId(null);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader
        title="Подключения Ozon"
        subtitle="Управление API-ключами через backend"
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Отмена' : 'Подключить Ozon'}
          </Button>
        }
      />

      <LegalNotice />

      {showForm && (
        <Card title="Новое подключение">
          <form className={styles.form} onSubmit={handleCreate}>
            <div className={styles.field}>
              <label htmlFor="sellerName">Название подключения</label>
              <input
                id="sellerName"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Магазин Ozon"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="clientId">Client-Id</label>
              <input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="apiKey">Api-Key</label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {formError && <ErrorState message={formError} />}
            <Button type="submit" disabled={createMut.isPending}>
              Сохранить
            </Button>
          </form>
        </Card>
      )}

      {!data?.length ? (
        <EmptyState
          title="Подключений пока нет"
          description="Добавьте Client-Id и Api-Key для начала работы"
          action={<Button onClick={() => setShowForm(true)}>Подключить Ozon</Button>}
        />
      ) : (
        data.map((conn) => {
          const status = mapConnectionStatus(String(conn.status));
          return (
            <Card key={conn.id} title={conn.sellerName}>
              <p>
                Client-Id: <code>{conn.clientId.slice(0, 4)}••••</code>
              </p>
              <p>
                Статус: <Badge tone={statusTone(status)}>{status}</Badge>
              </p>
              <p>Последняя синхронизация: {formatDate(conn.lastSyncAt)}</p>
              <div className={`${styles.actions} ${styles.mtMd}`}>
                <Button
                  variant="secondary"
                  disabled={checkingId === conn.id}
                  onClick={() => void handleHealthCheck(conn.id)}
                >
                  Проверить соединение
                </Button>
                <Button
                  variant="secondary"
                  disabled={syncMut.isPending}
                  onClick={() => syncMut.mutate(conn.id)}
                >
                  Синхронизировать сейчас
                </Button>
                <Link to={`/ozon/connections/${conn.id}/audit`}>
                  <Button variant="ghost">Открыть audit</Button>
                </Link>
                <Button
                  variant="danger"
                  disabled={deleteMut.isPending}
                  onClick={() => {
                    if (window.confirm('Удалить подключение?')) {
                      deleteMut.mutate(conn.id);
                    }
                  }}
                >
                  Удалить
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
