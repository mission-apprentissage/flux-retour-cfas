import { StatsFilters } from "./StatsFilters";
import styles from "./StatsPageHeader.module.css";

interface StatsPageHeaderProps {
  title: string;
  description: React.ReactNode;
  showFilters?: boolean;
}

export function StatsPageHeader({ title, description, showFilters = true }: StatsPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      {showFilters && <StatsFilters />}
    </header>
  );
}
