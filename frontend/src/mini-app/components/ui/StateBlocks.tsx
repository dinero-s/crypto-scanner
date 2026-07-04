import type { ReactNode } from 'react';
import styles from './StateBlocks.module.css';

export function LoadingState({ message = 'Загрузка…' }: { message?: string }) {
  return (
    <div className={styles.center} role="status">
      <div className={styles.spinner} />
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.error} role="alert">
      <strong>Ошибка</strong>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function RiskDisclaimer() {
  return (
    <div className={styles.disclaimer} role="note">
      <strong>Дисклеймер о рисках</strong>
      Все показатели доходности являются теоретическими оценками (estimated) и рассчитаны
      с учётом предполагаемых комиссий. Прибыль не гарантирована. Рынок криптовалют
      волатилен — проверяйте данные перед принятием решений.
    </div>
  );
}
