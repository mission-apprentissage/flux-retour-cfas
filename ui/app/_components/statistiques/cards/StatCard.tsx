import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { calculatePercentage, COLORS, getPercentageColor } from "../constants";
import { CardSkeleton, Skeleton } from "../ui/Skeleton";

import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: number | undefined;
  previousValue?: number | undefined;
  variation?: string;
  loading: boolean;
  loadingPercentage?: boolean;
  tooltip?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  previousValue,
  variation,
  loading,
  loadingPercentage = false,
  tooltip,
}: StatCardProps) {
  const percentage = variation || (previousValue !== undefined ? calculatePercentage(value || 0, previousValue) : null);
  const percentageColor =
    variation !== undefined
      ? variation.startsWith("+")
        ? COLORS.SUCCESS
        : variation.startsWith("-")
          ? COLORS.ERROR
          : COLORS.GREY
      : previousValue !== undefined
        ? getPercentageColor(value || 0, previousValue)
        : undefined;

  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        <div className={styles.cardContent}>
          <p className={styles.cardLabel}>{label}</p>
          {loading ? (
            <CardSkeleton />
          ) : (
            <>
              <p className={styles.cardValue}>
                {value?.toLocaleString("fr-FR") || 0}
                {tooltip && (
                  <span className={styles.tooltip}>
                    <Tooltip kind="hover" title={tooltip} />
                  </span>
                )}
              </p>
              {loadingPercentage ? (
                <Skeleton width="40px" height="20px" />
              ) : (
                percentage && (
                  <p className={styles.cardPercentage} style={{ color: percentageColor }}>
                    {percentage}
                  </p>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
