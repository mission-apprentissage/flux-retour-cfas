"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { ReactNode } from "react";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "./encart-admin.module.scss";

export type EligibilityCheck = {
  passed: boolean;
  details?: {
    effectifsErpCount?: number;
    effectifsDecaCount?: number;
    formateursTiersCount?: number;
    natureActuelle?: string | null;
  };
};

export function EtatBadge({ active, suspendedAt }: { active: boolean; suspendedAt?: string | Date | null }) {
  if (active && suspendedAt) {
    return (
      <Badge severity="warning" small>
        Suspendue depuis le {formatDate(suspendedAt)}
      </Badge>
    );
  }
  return active ? (
    <Badge severity="success" small>
      Activé
    </Badge>
  ) : (
    <Badge noIcon small>
      Non activé
    </Badge>
  );
}

export function CheckLine({ passed, children }: { passed: boolean; children: ReactNode }) {
  const iconClassName = passed
    ? `fr-icon-checkbox-circle-fill fr-icon--sm ${styles.checkIconOk}`
    : `fr-icon-close-circle-fill fr-icon--sm ${styles.checkIconKo}`;

  return (
    <p className={styles.checkLine}>
      <i className={iconClassName} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
