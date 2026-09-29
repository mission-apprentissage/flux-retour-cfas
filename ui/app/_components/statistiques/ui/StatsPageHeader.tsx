import { StatsFilters } from "./StatsFilters";
import styles from "./StatsPageHeader.module.css";

interface StatsPageHeaderProps {
  title: string;
  description: React.ReactNode;
}

export function StatsPageHeader({ title, description }: StatsPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      <StatsFilters />
    </header>
  );
}
