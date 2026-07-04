import { useQuery } from '@tanstack/react-query';
import { getAdminHealth } from '../../api/admin/adminApi';
import { healthTone } from '../../components/admin/AdminBadge';
import { Badge, Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { getHumanError } from '../../utils/ozon';
import { translateService, translateStatus } from './adminRu';
import styles from '../../components/ui/Page.module.css';

export function AdminHealthPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: getAdminHealth,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Данные о состоянии системы недоступны" />;

  const services = Object.entries(data) as Array<[string, (typeof data)['backend']]>;

  return (
    <div>
      <PageHeader title="Состояние системы" subtitle="Мониторинг сервисов через backend API" />
      <div className={styles.grid}>
        {services.map(([name, service]) => (
          <Card key={name} title={translateService(name)}>
            <Badge tone={healthTone(service.status)}>{translateStatus(service.status)}</Badge>
            <p>{service.message}</p>
            <small className={styles.muted}>Проверено: {service.checkedAt}</small>
          </Card>
        ))}
      </div>
    </div>
  );
}
