import { Badge } from '../ui/Page';
import { translateStatus } from '../../pages/admin/adminRu';

export function AdminStatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? 'UNKNOWN').toUpperCase();
  const label = translateStatus(normalized);

  if (['OK', 'ACTIVE'].includes(normalized)) {
    return <Badge tone="success">{label}</Badge>;
  }
  if (['BLOCKED', 'DISABLED', 'FAILED', 'ERROR'].includes(normalized)) {
    return <Badge tone="danger">{label}</Badge>;
  }
  return <Badge tone="neutral">{label}</Badge>;
}
