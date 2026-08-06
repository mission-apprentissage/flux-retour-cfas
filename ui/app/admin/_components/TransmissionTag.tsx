"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { isBefore, subMonths, subWeeks } from "date-fns";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "./transmission-tag.module.scss";

const STATES = {
  arretee: { severity: "warning", label: "Arrêtée", hint: "Aucune transmission depuis plus de 3 mois" },
  ancienne: { severity: "info", label: "Ancienne", hint: "Aucune transmission depuis plus d’une semaine" },
  aJour: { severity: "success", label: "À jour", hint: "Transmission de moins d’une semaine" },
} as const;

export function TransmissionTag({ lastTransmissionDate }: { lastTransmissionDate?: string | null }) {
  if (!lastTransmissionDate) {
    return (
      <span title="Cet organisme n’a jamais transmis d’effectifs">
        <Badge severity="error" small>
          Aucune
        </Badge>
      </span>
    );
  }

  const date = new Date(lastTransmissionDate);
  const state = isBefore(date, subMonths(new Date(), 3))
    ? STATES.arretee
    : isBefore(date, subWeeks(new Date(), 1))
      ? STATES.ancienne
      : STATES.aJour;

  return (
    <span className={styles.tag} title={state.hint}>
      <Badge severity={state.severity} small>
        {state.label}
      </Badge>
      <span className={styles.date}>Le {formatDate(lastTransmissionDate)}</span>
    </span>
  );
}
