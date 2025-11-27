import styles from "./legend.module.css";

interface LegendItem {
  label: string;
  color: string;
  value: number;
  variation?: string;
  variationColor?: string;
}

interface ChartLegendProps {
  items: LegendItem[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className={styles.legendContainer}>
      {items.map((item, index) => (
        <div key={index} className={styles.legendItem}>
          <div className={styles.legendLeftContent}>
            <div className={styles.legendColorCircle} style={{ backgroundColor: item.color }} />
            <span className={styles.legendLabel}>{item.label}</span>
          </div>
          <div className={styles.legendRightContent}>
            {item.variation && (
              <span className={styles.legendVariation} style={{ color: item.variationColor }}>
                {item.variation}
              </span>
            )}
            <span className={styles.legendValue}>{item.value.toLocaleString("fr-FR")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
