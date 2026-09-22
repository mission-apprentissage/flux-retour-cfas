import { Skeleton } from "@/app/_components/common/Skeleton";

import styles from "./legend.module.css";

interface LegendItem {
  label: string;
  sublabel?: string;
  color: string;
  value: number;
  variation?: string;
  variationColor?: string;
}

interface ChartLegendProps {
  items: LegendItem[];
  loadingVariation?: boolean;
}

export function ChartLegend({ items, loadingVariation = false }: ChartLegendProps) {
  return (
    <div className={styles.legendContainer}>
      {items.map((item, index) => (
        <div key={index} className={styles.legendItem}>
          <div className={styles.legendLeftContent}>
            <div className={styles.legendColorCircle} style={{ backgroundColor: item.color }} />
            <span className={styles.legendLabel}>
              {item.label}
              {item.sublabel && <span className={styles.legendSublabel}>{item.sublabel}</span>}
            </span>
          </div>
          <div className={styles.legendRightContent}>
            <span className={styles.legendValue}>{item.value.toLocaleString("fr-FR")}</span>
            {item.variation !== undefined &&
              (loadingVariation ? (
                <Skeleton width="40px" height="16px" />
              ) : (
                <span className={styles.legendVariation} style={{ color: item.variationColor }}>
                  {item.variation}
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
