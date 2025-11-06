import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ width = "100%", height = "24px", className }: SkeletonProps) {
  return <div className={`${styles.skeleton} ${className || ""}`} style={{ width, height }} />;
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={className}>
      <Skeleton width="80px" height="24px" className={styles.skeletonMarginBottom} />
      <Skeleton width="40px" height="20px" />
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div>
      <Skeleton height="40px" className={styles.skeletonMarginBottom} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="60px" className={styles.skeletonRow} />
      ))}
    </div>
  );
}
