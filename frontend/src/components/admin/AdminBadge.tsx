import { Badge } from '../ui/Page';
import type { HealthServiceStatus } from '../../api/admin/adminTypes';
import { translateStatus } from '../../pages/admin/adminRu';

export function AdminStatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? 'UNKNOWN').toUpperCase();
  const label = translateStatus(normalized);

  if (['OK', 'ACTIVE', 'SENT', 'ALLOWED', 'COMPLETED'].includes(normalized)) {
    return <Badge tone="success">{label}</Badge>;
  }
  if (['DEGRADED', 'PARTIAL', 'RETRYING', 'DELAYED', 'PENDING', 'SKIPPED'].includes(normalized)) {
    return <Badge tone="warning">{label}</Badge>;
  }
  if (['DOWN', 'FAILED', 'BLOCKED', 'ERROR', 'INVALID', 'CANCELLED'].includes(normalized)) {
    return <Badge tone="danger">{label}</Badge>;
  }
  if (normalized === 'NOT_AVAILABLE_VIA_OFFICIAL_API') {
    return <Badge tone="info">{label}</Badge>;
  }
  return <Badge tone="neutral">{label}</Badge>;
}

export function healthTone(status: HealthServiceStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'OK') return 'success';
  if (status === 'DEGRADED') return 'warning';
  if (status === 'DOWN') return 'danger';
  return 'neutral';
}
