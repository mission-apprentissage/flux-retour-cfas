import styles from "./KpiFunnel.module.css";

export const kpiFunnelCardClassName = styles.kpi;

interface KpiFunnelProps {
  title: string;
  children: React.ReactNode;
}

export function KpiFunnel({ title, children }: KpiFunnelProps) {
  return (
    <div className={styles.funnel}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.kpis}>{children}</div>
    </div>
  );
}
