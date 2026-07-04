import styles from './Skeleton.module.css';

export function SkeletonLine({ short }: { short?: boolean }) {
  return <div className={short ? styles.lineShort : styles.line} />;
}

export function SkeletonBlock() {
  return <div className={styles.block} />;
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.cardGrid}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.cardSkeleton} />
      ))}
    </div>
  );
}

export function SkeletonTableRows({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.tableRow}>
          <div>
            <SkeletonLine />
            <SkeletonLine short />
          </div>
          <div className={styles.line} style={{ width: 48 }} />
        </div>
      ))}
    </>
  );
}

export function SkeletonPage() {
  return (
    <div>
      <div className={styles.lineTitle} />
      <SkeletonCardGrid />
      <SkeletonBlock />
      <SkeletonTableRows />
    </div>
  );
}
