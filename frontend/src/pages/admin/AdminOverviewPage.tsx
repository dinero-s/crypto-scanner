import { useQuery } from '@tanstack/react-query';
import { getAdminOverview } from '../../api/admin/adminApi';
import { PageHeader } from '../../components/ui/Page';
import { ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { getHumanError } from '../../utils/ozon';
import { AdminOverviewPageContent } from './AdminOverviewContent';

export function AdminOverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: getAdminOverview,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;
  if (!data) return <ErrorState message="Нет данных для обзора" />;

  return (
    <div>
      <PageHeader title="Обзор" subtitle="Сводка SaaS-платформы" />
      <AdminOverviewPageContent data={data} />
    </div>
  );
}
