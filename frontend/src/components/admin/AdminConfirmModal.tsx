import { Button } from '../ui/Page';
import styles from './AdminConfirmModal.module.css';

export function AdminConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Подтвердить',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Отмена
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
