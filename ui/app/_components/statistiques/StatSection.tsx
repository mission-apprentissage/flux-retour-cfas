import { fr } from "@codegouvfr/react-dsfr";
import { ReactNode } from "react";

import styles from "./SyntheseView.module.css";

interface StatSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function StatSection({ title, children, className }: StatSectionProps) {
  return (
    <section className={`${fr.cx("fr-mb-6w")} ${className || styles.traitementSection}`}>
      <h2 className={fr.cx("fr-h4", "fr-mb-3w")}>{title}</h2>
      {children}
    </section>
  );
}
