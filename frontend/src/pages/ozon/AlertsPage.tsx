import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAlerts, getConnections, sendTestAlert } from '../../api/ozon/ozonApi';
import { Badge, Button, Card, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import styles from '../../components/ui/Page.module.css';

export function AlertsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['ozon', 'alerts'],
    queryFn: () => getAlerts(),
  });

  const connections = useQuery({
    queryKey: ['ozon', 'connections'],
    queryFn: getConnections,
  });

  const testMut = useMutation({
    mutationFn: sendTestAlert,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ozon', 'alerts'] }),
  });

  const userEmail = undefined;
  const telegramConfigured = connections.data?.some((c) => Boolean(c.telegramChatId));

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="Уведомления через email и Telegram (backend)"
        actions={
          <Button
            disabled={testMut.isPending}
            onClick={() =>
              testMut.mutate({
                type: 'ai_recommendation',
                severity: 'medium',
                message: 'Тестовое уведомление Ozon Operator',
                connectionId: connections.data?.[0]?.id,
              })
            }
          >
            Отправить тестовый alert
          </Button>
        }
      />

      {!userEmail && (
        <Card>
          <p className={`${styles.textWarning} ${styles.cardText}`}>
            Email не указан в профиле. Email-уведомления будут пропущены.
          </p>
        </Card>
      )}

      {!telegramConfigured && (
        <Card>
          <p className={`${styles.textWarning} ${styles.cardText}`}>
            Telegram-уведомления не настроены. Добавьте Telegram Bot Token в настройках backend.
          </p>
        </Card>
      )}

      {!data?.length ? (
        <EmptyState title="Alerts пока нет" />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Сообщение</th>
                <th>Channel</th>
                <th>Статус</th>
                <th>Ошибка</th>
                <th>Создан</th>
                <th>Товар / рекомендация</th>
              </tr>
            </thead>
            <tbody>
              {data.map((alert) => {
                const channel =
                  alert.channel ??
                  (alert.payload?.channel as string | undefined) ??
                  'EMAIL';
                const deliveryError =
                  alert.deliveryError ??
                  (alert.status === 'failed' || alert.status === 'FAILED'
                    ? String(alert.payload?.error ?? 'Ошибка отправки')
                    : undefined);

                return (
                  <tr key={alert.id}>
                    <td>{alert.message}</td>
                    <td>
                      <Badge tone="info">{String(channel).toUpperCase()}</Badge>
                    </td>
                    <td>
                      <Badge
                        tone={
                          alert.status === 'failed' || alert.status === 'FAILED'
                            ? 'danger'
                            : alert.status === 'sent' || alert.status === 'SENT'
                              ? 'success'
                              : 'neutral'
                        }
                      >
                        {String(alert.status).toUpperCase()}
                      </Badge>
                    </td>
                    <td className={styles.textDanger} style={{ fontSize: 12 }}>
                      {deliveryError ?? '—'}
                    </td>
                    <td>{formatDate(alert.createdAt)}</td>
                    <td>{alert.productId ?? alert.recommendationId ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
