import { SystemProps, Text } from "@chakra-ui/react";

import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";

import { getTranmissionDonneesState } from "./transmissionDonnees";

interface InfoTextTransmissionDonneesProps extends SystemProps {
  lastTransmissionDate?: string;
  permissionInfoTransmissionEffectifs?: boolean;
}
function InfoTextTransmissionDonnees({
  lastTransmissionDate,
  permissionInfoTransmissionEffectifs,
  ...props
}: InfoTextTransmissionDonneesProps) {
  const state = getTranmissionDonneesState(lastTransmissionDate, permissionInfoTransmissionEffectifs);

  switch (state) {
    case "donnees_non_disponibles":
      return (
        <Text color="mgalt" {...props}>
          Données non disponibles
        </Text>
      );
    case "donnees_non_transmises":
      return (
        <Text color="error" {...props}>
          Données non transmises
        </Text>
      );
    case "donnees_obsoletes":
      return (
        <Text color="#E63122" {...props}>
          {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
        </Text>
      );
    case "donnees_anciennes":
      return (
        <Text color="#FF732C" {...props}>
          {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
        </Text>
      );
    case "donnees_recentes":
      return (
        <Text color="greensoft.600" {...props}>
          {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
        </Text>
      );
  }
}
export default InfoTextTransmissionDonnees;
