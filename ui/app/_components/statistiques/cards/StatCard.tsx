import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { CardSkeleton, Skeleton } from "@/app/_components/common/Skeleton";

import { calculatePercentage, COLORS, getPercentageColor } from "../constants";

import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: number | undefined;
  previousValue?: number | undefined;
  variation?: string;
  loading: boolean;
  loadingPercentage?: boolean;
  tooltip?: React.ReactNode;
  suffix?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  previousValue,
  variation,
  loading,
  loadingPercentage = false,
  tooltip,
  suffix,
  className,
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
    <div className={`${styles.card} ${className ?? ""}`}>
      <div className={styles.cardBody}>
        <div className={styles.cardContent}>
          <p className={styles.cardLabel}>{label}</p>
          {loading ? (
            <CardSkeleton />
          ) : (
            <>
              <div className={styles.cardValue}>
                {value?.toLocaleString("fr-FR") || 0}
                {suffix}
                {tooltip && (
                  <span className={styles.tooltip}>
                    <Tooltip kind="hover" title={tooltip} />
                  </span>
                )}
              </div>
              {loadingPercentage ? (
                <Skeleton width="40px" height="20px" />
              ) : (
                percentage &&
                percentage !== "0%" && (
                  <p
                    className={styles.cardPercentage}
                    style={{ color: percentageColor }}
                    title="Évolution par rapport à la période précédente de même durée"
                  >
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
