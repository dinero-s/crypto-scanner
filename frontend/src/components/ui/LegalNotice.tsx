import styles from './LegalNotice.module.css';
import { LEGAL_NOTICE } from '../../utils/ozon';

export function LegalNotice() {
  return (
    <aside className={styles.notice} role="note">
      <span className={styles.icon}>ℹ️</span>
      <p>{LEGAL_NOTICE}</p>
    </aside>
  );
}
