"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { isBefore, subMonths, subWeeks } from "date-fns";

import { TRANSMISSION_ORGANISME } from "@/common/constants/organismes";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";

import styles from "./organismes.module.scss";

type TranmissionDonneesState =
  | "donnees_non_disponibles"
  | "donnees_non_transmises"
  | "donnees_obsoletes"
  | "donnees_anciennes"
  | "donnees_recentes";

function getTranmissionDonneesState(
  lastTransmissionDate?: string,
  permissionInfoTransmissionEffectifs?: boolean
): TranmissionDonneesState {
  return !permissionInfoTransmissionEffectifs
    ? "donnees_non_disponibles"
    : !lastTransmissionDate
      ? "donnees_non_transmises"
      : isBefore(new Date(lastTransmissionDate), subMonths(new Date(), 3))
        ? "donnees_obsoletes"
        : isBefore(new Date(lastTransmissionDate), subWeeks(new Date(), 1))
          ? "donnees_anciennes"
          : "donnees_recentes";
}

interface InfoTransmissionDonneesProps {
  lastTransmissionDate?: string;
  permissionInfoTransmissionEffectifs?: boolean;
  modeBadge?: boolean;
}

export function InfoTransmissionDonnees({
  lastTransmissionDate,
  permissionInfoTransmissionEffectifs,
  modeBadge = false,
}: InfoTransmissionDonneesProps) {
  const state = getTranmissionDonneesState(lastTransmissionDate, permissionInfoTransmissionEffectifs);
  const maj = lastTransmissionDate
    ? `${modeBadge ? "Dernière " : ""}MAJ : ${formatDateNumericDayMonthYear(lastTransmissionDate)}`
    : null;

  switch (state) {
    case "donnees_non_disponibles":
      return (
        <Badge noIcon small>
          {modeBadge ? "Données non disponibles" : TRANSMISSION_ORGANISME.non_disponible}
        </Badge>
      );
    case "donnees_non_transmises":
      return (
        <Badge severity="error" noIcon small>
          {modeBadge ? "Données non transmises" : TRANSMISSION_ORGANISME.aucune_transmission}
        </Badge>
      );
    case "donnees_obsoletes":
      return (
        <span className={styles.transmissionCell}>
          <Badge severity="error" small>
            {modeBadge ? "Données obsolètes" : TRANSMISSION_ORGANISME.arret_transmission}
          </Badge>
          <span className={styles.transmissionDate}>{maj}</span>
        </span>
      );
    case "donnees_anciennes":
      return (
        <span className={styles.transmissionCell}>
          <Badge severity="warning" small>
            {modeBadge ? "Données transmises" : TRANSMISSION_ORGANISME.transmission}
          </Badge>
          <span className={styles.transmissionDate}>{maj}</span>
        </span>
      );
    case "donnees_recentes":
      return (
        <span className={styles.transmissionCell}>
          <Badge severity="success" small>
            {modeBadge ? "Données transmises" : TRANSMISSION_ORGANISME.transmission}
          </Badge>
          <span className={styles.transmissionDate}>{maj}</span>
        </span>
      );
  }
}
