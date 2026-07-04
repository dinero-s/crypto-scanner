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
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.error} role="alert">
      <strong>Ошибка</strong>
      <p>{message}</p>
    </div>
  );
}

export function ComplianceBlock({ message }: { message: string }) {
  return (
    <div className={styles.compliance} role="alert">
      <span>⚖️</span>
      <div>
        <strong>Соответствие</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
