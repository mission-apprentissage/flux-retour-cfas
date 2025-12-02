import styles from "./common.module.css";

interface ViewHeaderProps {
  title: string;
  icon: React.ReactNode;
}

export function ViewHeader({ title, icon }: ViewHeaderProps) {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.logoContainer}>{icon}</div>
      <h2 className={styles.headerTitle}>{title}</h2>
    </div>
  );
}
