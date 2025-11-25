import type { ITraitementDetails } from "shared/models/data/nationalStats.model";

import { TRAITEMENT_SEGMENTS } from "./statistiques.config";
import styles from "./TraitementTable.module.css";

interface TraitementDetailsBarProps {
  details: ITraitementDetails;
  total: number;
}

export function TraitementDetailsBar({ details, total }: TraitementDetailsBarProps) {
  if (total === 0) {
    return <span className={styles.emptyValue}>-</span>;
  }

  const segments = TRAITEMENT_SEGMENTS.map((segment) => {
    const value = details[segment.key] || 0;
    const percentage = (value / total) * 100;
    return {
      ...segment,
      value,
      percentage,
    };
  }).filter((s) => s.value > 0);

  return (
    <div className={styles.stackedBarContainer}>
      <div className={styles.stackedBar}>
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={styles.stackedBarSegment}
            style={{
              width: `${segment.percentage}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>
      <div className={styles.stackedBarTooltip}>
        <div className={styles.tooltipTitle}>Détails</div>
        {segments.map((s) => (
          <div key={s.key} className={styles.tooltipItem}>
            <span className={styles.tooltipDot} style={{ backgroundColor: s.color }} />
            <span className={styles.tooltipLabel}>{s.label}</span>
            <span className={styles.tooltipValue}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
