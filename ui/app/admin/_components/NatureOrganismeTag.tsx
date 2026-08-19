"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { NATURE_ORGANISME } from "@/common/constants/organismes";

import styles from "./nature-organisme-tag.module.scss";

const NATURE_CLASS: Record<keyof typeof NATURE_ORGANISME, string> = {
  responsable: styles.responsable,
  formateur: styles.formateur,
  responsable_formateur: styles.responsableFormateur,
  lieu_formation: styles.inconnue,
  inconnue: styles.inconnue,
};

export function NatureOrganismeTag({ nature }: { nature: keyof typeof NATURE_ORGANISME }) {
  return (
    <Tag small className={NATURE_CLASS[nature] ?? NATURE_CLASS.inconnue}>
      {NATURE_ORGANISME[nature] ?? NATURE_ORGANISME.inconnue}
    </Tag>
  );
}
