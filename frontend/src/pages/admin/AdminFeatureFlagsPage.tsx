import { useQuery } from '@tanstack/react-query';
import { getAdminFeatureFlags } from '../../api/admin/adminApi';
import { Badge, Card, PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { getHumanError } from '../../utils/ozon';
import { flagOnOff } from './adminRu';
import styles from '../../components/ui/Page.module.css';

export function AdminFeatureFlagsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: getAdminFeatureFlags,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Флаги функций недоступны" />;

  return (
    <div>
      <PageHeader
        title="Флаги функций"
        subtitle="Только для чтения — значения из конфигурации backend"
      />
      <Card>
        {Object.entries(data).map(([key, value]) => (
          <p key={key}>
            {key}:{' '}
            <Badge tone={value ? 'success' : 'neutral'}>{flagOnOff(value)}</Badge>
          </p>
        ))}
      </Card>
      {!data.WB_OPERATOR_ENABLED && (
        <Card>
          <p className={styles.infoBox}>
            Wildberries Operator пока отключён. Его можно добавить позже как отдельный
            marketplace-модуль после стабилизации Ozon MVP.
          </p>
        </Card>
      )}
    </div>
  );
}
