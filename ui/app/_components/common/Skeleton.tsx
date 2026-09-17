import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  inline?: boolean;
}

export function Skeleton({ width = "100%", height = "24px", className, inline = false }: SkeletonProps) {
  const Element = inline ? "span" : "div";
  return (
    <Element
      className={`${styles.skeleton} ${inline ? styles.skeletonInline : ""} ${className || ""}`}
      style={{ width, height }}
    />
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={className}>
      <Skeleton width="80px" height="20px" className={styles.skeletonMarginBottom} />
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
