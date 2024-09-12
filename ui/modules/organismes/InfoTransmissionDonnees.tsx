import { WarningTwoIcon } from "@chakra-ui/icons";
import { SystemProps } from "@chakra-ui/react";
import { isBefore, subMonths, subWeeks } from "date-fns";

import { TRANSMISSION_ORGANISME } from "@/common/constants/organismes";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import Tag from "@/components/Tag/Tag";
import { Checkbox } from "@/theme/components/icons";
import { CloseCircle } from "@/theme/components/icons/CloseCircle";

interface BadgeTransmissionDonneesProps extends SystemProps {
  lastTransmissionDate?: string;
  permissionInfoTransmissionEffectifs?: boolean;
  modeBadge?: boolean;
}
function InfoTransmissionDonnees({
  lastTransmissionDate,
  permissionInfoTransmissionEffectifs,
  modeBadge = false,
  ...props
}: BadgeTransmissionDonneesProps) {
  const state = getTranmissionDonneesState(lastTransmissionDate, permissionInfoTransmissionEffectifs);

  switch (state) {
    case "donnees_non_disponibles":
      return (
        <Tag
          leftIcon={CloseCircle}
          primaryText={modeBadge ? "Données non disponibles" : TRANSMISSION_ORGANISME.non_disponible}
          colorScheme="grey_tag"
          variant={modeBadge ? "badge" : "text"}
          {...props}
        />
      );
    case "donnees_non_transmises":
      return (
        <Tag
          leftIcon={CloseCircle}
          primaryText={modeBadge ? "Données non transmises" : TRANSMISSION_ORGANISME.aucune_transmission}
          variant={modeBadge ? "badge" : "text"}
          colorScheme="red_tag"
          {...props}
        />
      );
    case "donnees_obsoletes":
      return (
        <Tag
          leftIcon={WarningTwoIcon}
          primaryText={modeBadge ? "Données obsolètes" : TRANSMISSION_ORGANISME.arret_transmission}
          secondaryText={`${modeBadge ? "Dernière " : ""}MAJ : ${formatDateNumericDayMonthYear(lastTransmissionDate as string)}`}
          colorScheme="redlight_tag"
          variant={modeBadge ? "badge" : "text"}
          {...props}
        />
      );
    case "donnees_anciennes":
      return (
        <Tag
          leftIcon={Checkbox}
          primaryText={modeBadge ? "Données transmises" : TRANSMISSION_ORGANISME.transmission}
          secondaryText={`${modeBadge ? "Dernière " : ""}MAJ : ${formatDateNumericDayMonthYear(lastTransmissionDate as string)}`}
          colorScheme="orange_tag"
          variant={modeBadge ? "badge" : "text"}
          {...props}
        />
      );
    case "donnees_recentes":
      return (
        <Tag
          leftIcon={Checkbox}
          primaryText={modeBadge ? "Données transmises" : TRANSMISSION_ORGANISME.transmission}
          secondaryText={`${modeBadge ? "Dernière " : ""}MAJ : ${formatDateNumericDayMonthYear(lastTransmissionDate as string)}`}
          colorScheme="green_tag"
          variant={modeBadge ? "badge" : "text"}
          {...props}
        />
      );
  }
}
export default InfoTransmissionDonnees;

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
