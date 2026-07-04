import styles from './AvailabilityBadge.module.css';
import { UNAVAILABLE_MESSAGE, isUnavailableStatus } from '../../utils/ozon';
import type { AvailabilityStatus } from '../../types/ozon';

interface Props {
  status?: AvailabilityStatus | string;
  showMessage?: boolean;
}

export function AvailabilityBadge({ status, showMessage = false }: Props) {
  if (!status) return null;

  const unavailable = isUnavailableStatus(status);
  const partial = String(status).toUpperCase() === 'PARTIAL';

  const className = unavailable
    ? styles.unavailable
    : partial
      ? styles.partial
      : styles.available;

  const label = unavailable
    ? 'Недоступно через API'
    : partial
      ? 'Частичные данные'
      : 'Доступно';

  return (
    <div className={styles.wrapper}>
      <span className={`${styles.badge} ${className}`}>{label}</span>
      {showMessage && unavailable && (
        <p className={styles.message}>{UNAVAILABLE_MESSAGE}</p>
      )}
    </div>
  );
}
