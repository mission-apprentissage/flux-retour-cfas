import { fr } from "@codegouvfr/react-dsfr";
import { ReactNode } from "react";

import styles from "./SyntheseView.module.css";

interface CardSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function CardSection({ title, children, className }: CardSectionProps) {
  return (
    <section className={`${fr.cx("fr-mb-3w")} ${className || styles.traitementSection}`}>
      <h2 className={fr.cx("fr-h4", "fr-mb-3w")}>{title}</h2>
      {children}
    </section>
  );
}
