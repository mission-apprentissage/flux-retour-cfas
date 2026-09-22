import styles from "./common.module.css";

interface ViewHeaderProps {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}

export function ViewHeader({ title, icon, action }: ViewHeaderProps) {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.logoContainer}>{icon}</div>
      <div className={styles.headerRow}>
        <h2 className={styles.headerTitle}>{title}</h2>
        {action && <div className={styles.headerAction}>{action}</div>}
      </div>
    </div>
  );
}
