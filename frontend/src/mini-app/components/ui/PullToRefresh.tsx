import { useCallback, useRef, useState, type ReactNode } from 'react';
import styles from './PullToRefresh.module.css';

const THRESHOLD = 64;

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) return;
      startY.current = e.touches[0]?.clientY ?? 0;
      pulling.current = true;
    },
    [disabled, refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || disabled || refreshing) return;
      const currentY = e.touches[0]?.clientY ?? 0;
      const diff = Math.max(0, (currentY - startY.current) * 0.45);
      setPullDistance(diff);
    },
    [disabled, refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD && !disabled && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
      return;
    }

    setPullDistance(0);
  }, [pullDistance, disabled, refreshing, onRefresh]);

  const showIndicator = pullDistance > 8 || refreshing;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => {
        void handleTouchEnd();
      }}
    >
      {showIndicator && (
        <div
          className={styles.indicator}
          style={{ height: refreshing ? THRESHOLD : pullDistance }}
        >
          <span className={refreshing ? styles.spinning : styles.arrow}>↓</span>
          <span className={styles.label}>
            {refreshing ? 'Обновление…' : pullDistance >= THRESHOLD ? 'Отпустите' : 'Потяните'}
          </span>
        </div>
      )}
      <div
        className={styles.content}
        style={{ transform: pullDistance > 0 ? `translateY(${String(pullDistance)}px)` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
