"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

import styles from "./support-value.module.scss";

export type SupportLevel = "success" | "error" | "warning" | "info";

/** Statuts uniquement : présence, état, fiabilité, éligibilité. */
export function SupportBadge({
  value,
  level = "info",
}: {
  value: string | number | boolean | null | undefined;
  level?: SupportLevel;
}) {
  const text = typeof value === "boolean" ? (value ? "Oui" : "Non") : (value ?? "Inconnu");

  return (
    <Badge as="span" severity={level} small noIcon>
      {String(text) || "Inconnu"}
    </Badge>
  );
}

/**
 * Valeurs de données : lisibles telles quelles, jamais en capitales.
 * `level` colore la valeur et ajoute un repère non chromatique.
 */
export function SupportValue({
  value,
  level = "info",
  divergenceHint,
}: {
  value: string | number | boolean | null | undefined;
  level?: SupportLevel;
  divergenceHint?: string;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className={styles.missing}>Non renseigné</span>;
  }

  const text = typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);

  if (level === "error" || level === "warning") {
    return (
      <span className={level === "error" ? styles.error : styles.warning} title={divergenceHint}>
        <i className={fr.cx("fr-icon-warning-fill", "fr-icon--sm")} aria-hidden="true" />
        <span>{text}</span>
        {divergenceHint && <span className={fr.cx("fr-sr-only")}> — {divergenceHint}</span>}
      </span>
    );
  }

  return <span className={styles.value}>{text}</span>;
}
