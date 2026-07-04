import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  value?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

export function Card({
  title,
  value,
  subtitle,
  action,
  onClick,
  children,
  className,
}: CardProps) {
  const classNames = [styles.card, onClick ? styles.clickable : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || action) && (
        <div className={styles.cardHeader}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {action}
        </div>
      )}
      {value !== undefined && <p className={styles.cardValue}>{value}</p>}
      {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
      {children}
    </div>
  );
}
