import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { Skeleton } from "../ui/Skeleton";

import styles from "./DeploymentRow.module.css";

interface DeploymentRowProps {
  label: string | React.ReactNode;
  value: number | undefined | React.ReactNode;
  loading: boolean;
  loadingPercentage?: boolean;
  color?: string;
  percentage?: string;
  percentageColor?: string;
  tooltip?: string;
  indented?: boolean;
}

export function DeploymentRow({
  label,
  value,
  loading,
  loadingPercentage = false,
  color,
  percentage,
  percentageColor,
  tooltip,
  indented = false,
}: DeploymentRowProps) {
  const labelClassName = `${styles.deploymentLabelText}${indented ? ` ${styles.deploymentLabelIndented}` : ""}`;

  return (
    <div className={styles.deploymentRow}>
      <div className={styles.deploymentLabel}>
        {color && <div className={styles.deploymentDot} style={{ backgroundColor: color }} />}
        <p className={labelClassName}>{label}</p>
        {tooltip && <Tooltip kind="hover" title={tooltip} />}
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
          {percentage &&
            (loadingPercentage ? (
              <Skeleton width="40px" height="20px" />
            ) : (
              <p className={styles.cardPercentage} style={{ color: percentageColor }}>
                {percentage}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
