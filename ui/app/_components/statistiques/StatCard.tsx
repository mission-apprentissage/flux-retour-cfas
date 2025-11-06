import { calculatePercentage, getPercentageColor } from "./constants";
import { CardSkeleton } from "./Skeleton";
import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: number;
  previousValue: number;
  loading: boolean;
}

export function StatCard({ label, value, previousValue, loading }: StatCardProps) {
  const percentage = calculatePercentage(value || 0, previousValue || 0);
  const percentageColor = getPercentageColor(value || 0, previousValue || 0);

  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        <div className={styles.cardContent}>
          <p className={styles.cardLabel}>{label}</p>
          {loading ? (
            <CardSkeleton />
          ) : (
            <>
              <p className={styles.cardValue}>{value?.toLocaleString("fr-FR") || 0}</p>
              <p className={styles.cardPercentage} style={{ color: percentageColor }}>
                {percentage}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
