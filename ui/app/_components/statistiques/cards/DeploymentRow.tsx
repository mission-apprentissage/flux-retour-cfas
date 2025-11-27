import { Skeleton } from "../ui/Skeleton";

import styles from "./DeploymentRow.module.css";

interface DeploymentRowProps {
  label: string | React.ReactNode;
  value: number | undefined | React.ReactNode;
  loading: boolean;
  color?: string;
  percentage?: string;
  percentageColor?: string;
}

export function DeploymentRow({ label, value, loading, color, percentage, percentageColor }: DeploymentRowProps) {
  return (
    <div className={styles.deploymentRow}>
      <div className={styles.deploymentLabel}>
        {color && <div className={styles.deploymentDot} style={{ backgroundColor: color }} />}
        {typeof label === "string" ? <p className={styles.deploymentLabelText}>{label}</p> : label}
      </div>
      {loading ? (
        percentage ? (
          <div className={styles.deploymentValueWithPercentage}>
            <Skeleton width="60px" height="24px" />
            <Skeleton width="40px" height="20px" />
          </div>
        ) : (
          <Skeleton width="60px" height="24px" />
        )
      ) : (
        <div className={percentage ? styles.deploymentValueWithPercentage : undefined}>
          <p className={styles.deploymentValue}>{value}</p>
          {percentage && (
            <p className={styles.cardPercentage} style={{ color: percentageColor }}>
              {percentage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
