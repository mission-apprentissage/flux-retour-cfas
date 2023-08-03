import { isBefore, subMonths, subWeeks } from "date-fns";

export type TranmissionDonneesState =
  | "donnees_non_disponibles"
  | "donnees_non_transmises"
  | "donnees_obsoletes"
  | "donnees_anciennes"
  | "donnees_recentes";

export function getTranmissionDonneesState(
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
