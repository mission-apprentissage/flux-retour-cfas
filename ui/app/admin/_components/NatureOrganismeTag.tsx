"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";

import { NATURE_ORGANISME } from "@/common/constants/organismes";

import styles from "./nature-organisme-tag.module.scss";

export function NatureOrganismeTag({ nature }: { nature: keyof typeof NATURE_ORGANISME }) {
  const isInconnue = !nature || nature === "inconnue" || nature === "lieu_formation";
  const label = NATURE_ORGANISME[nature] ?? NATURE_ORGANISME.inconnue;

  return (
    <Badge severity={isInconnue ? "warning" : undefined} noIcon={!isInconnue} small className={styles.natureBadge}>
      {isInconnue ? label.replace("⚠ ", "") : label}
    </Badge>
  );
}
