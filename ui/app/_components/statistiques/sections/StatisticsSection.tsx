import { fr } from "@codegouvfr/react-dsfr";
import { ReactNode } from "react";

import styles from "./StatisticsSection.module.css";

interface StatisticsSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  width?: "full" | "two-thirds" | "one-third";
  controls?: ReactNode;
  controlsPosition?: "right" | "below-left";
  smallTitle?: boolean;
  wrapTitle?: boolean;
}

export function StatisticsSection({
  title,
  children,
  className,
  width = "full",
  controls,
  controlsPosition = "right",
  smallTitle = false,
  wrapTitle = false,
}: StatisticsSectionProps) {
  const widthClass = width === "one-third" ? styles.oneThird : width === "two-thirds" ? styles.twoThirds : styles.full;
  const titleClass = smallTitle ? fr.cx("fr-h6", "fr-mb-3w") : fr.cx("fr-h4", "fr-mb-3w");
  const headerClass = wrapTitle ? `${styles.header} ${styles.headerWrap}` : styles.header;

  const isBelowLeft = controlsPosition === "below-left";

  return (
    <section className={`${styles.section} ${widthClass} ${className || ""}`}>
      <div className={isBelowLeft ? styles.headerColumn : headerClass}>
        <h2 className={titleClass}>{title}</h2>
        {controls && <div className={isBelowLeft ? styles.controlsBelowLeft : styles.controls}>{controls}</div>}
      </div>
      {children}
    </section>
  );
}
