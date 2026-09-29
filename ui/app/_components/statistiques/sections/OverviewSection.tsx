import styles from "./OverviewSection.module.css";

interface OverviewSectionProps {
  title: string;
  children: React.ReactNode;
}

export function OverviewSection({ title, children }: OverviewSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>
  );
}
