import styles from "./OverviewCard.module.css";

interface OverviewCardProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}

export function OverviewCard({ title, actions, children, id }: OverviewCardProps) {
  return (
    <div className={styles.card} id={id}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}
