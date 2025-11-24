import { fr } from "@codegouvfr/react-dsfr";
import { ReactNode } from "react";

import styles from "./StatisticsSection.module.css";

interface StatisticsSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  width?: "full" | "two-thirds" | "one-third";
  controls?: ReactNode;
  smallTitle?: boolean;
}

export function StatisticsSection({
  title,
  children,
  className,
  width = "full",
  controls,
  smallTitle = false,
}: StatisticsSectionProps) {
  const widthClass = width === "one-third" ? styles.oneThird : width === "two-thirds" ? styles.twoThirds : styles.full;
  const titleClass = smallTitle ? fr.cx("fr-h6", "fr-mb-3w") : fr.cx("fr-h4", "fr-mb-3w");

  return (
    <section className={`${fr.cx("fr-mb-6w")} ${styles.section} ${widthClass} ${className || ""}`}>
      <div className={styles.header}>
        <h2 className={titleClass}>{title}</h2>
        {controls && <div className={styles.controls}>{controls}</div>}
      </div>
      {children}
    </section>
  );
}
