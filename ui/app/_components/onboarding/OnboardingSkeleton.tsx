import styles from "./OnboardingSkeleton.module.scss";

const SIDEBAR_BAR_WIDTHS = [120, 200, 160, 140];
const MAIN_BAR_WIDTHS: Array<number | string> = [300, 250, "100%", "100%", 200];

export function OnboardingSkeleton() {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        {SIDEBAR_BAR_WIDTHS.map((w, i) => (
          <div key={i} className={styles.bar} style={{ width: `${w}px` }} />
        ))}
      </div>
      <div className={styles.main}>
        <div className={`${styles.barLight} ${styles.title}`} />
        {MAIN_BAR_WIDTHS.map((w, i) => (
          <div
            key={i}
            className={`${styles.barLight} ${styles.input}`}
            style={{ width: typeof w === "number" ? `${w}px` : w }}
          />
        ))}
      </div>
    </div>
  );
}
