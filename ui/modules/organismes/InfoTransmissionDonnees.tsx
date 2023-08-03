import { WarningTwoIcon } from "@chakra-ui/icons";
import { Box, HStack, SystemProps, Text } from "@chakra-ui/react";
import { isBefore, subMonths, subWeeks } from "date-fns";

import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
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
        <HStack
          paddingX="1w"
          paddingY="2px"
          borderRadius={6}
          lineHeight="2em"
          backgroundColor={modeBadge ? "dgalt" : undefined}
          color="mgalt"
          {...props}
        >
          <CloseCircle />
          <Text fontSize="zeta" fontWeight={modeBadge ? "bold" : undefined}>
            {modeBadge ? "Données non disponibles" : "Non disponible"}
          </Text>
        </HStack>
      );
    case "donnees_non_transmises":
      return (
        <HStack
          paddingX="1w"
          paddingY="2px"
          borderRadius={6}
          lineHeight="2em"
          backgroundColor={modeBadge ? "#E1000F30" : undefined}
          color="error"
          {...props}
        >
          <CloseCircle />
          <Text fontSize="zeta" fontWeight={modeBadge ? "bold" : undefined}>
            {modeBadge ? "Données non transmises" : "Ne transmet pas"}
          </Text>
        </HStack>
      );
    case "donnees_obsoletes":
      return (
        <HStack
          paddingX="1w"
          paddingY="2px"
          borderRadius={6}
          backgroundColor={modeBadge ? "#E631221A" : undefined}
          color="#E63122"
          {...props}
        >
          <WarningTwoIcon boxSize={4} />
          <Box>
            <Text fontSize="zeta" fontWeight={modeBadge ? "bold" : undefined}>
              {modeBadge ? "Données obsolètes" : "Ne transmet plus"}
            </Text>
            <Text fontSize="x-small">
              {modeBadge && "Dernière "}MAJ&nbsp;: {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
            </Text>
          </Box>
        </HStack>
      );
    case "donnees_anciennes":
      return (
        <HStack
          paddingX="1w"
          paddingY="2px"
          borderRadius={6}
          backgroundColor={modeBadge ? "#FF732C1A" : undefined}
          color="#FF732C"
          {...props}
        >
          <Checkbox />
          <Box>
            <Text fontSize="zeta" fontWeight={modeBadge ? "bold" : undefined}>
              {modeBadge ? "Données transmises" : "Transmet"}
            </Text>
            <Text fontSize="x-small">
              {modeBadge && "Dernière "}MAJ&nbsp;: {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
            </Text>
          </Box>
        </HStack>
      );
    case "donnees_recentes":
      return (
        <HStack
          paddingX="1w"
          paddingY="2px"
          borderRadius={6}
          backgroundColor={modeBadge ? "greensoft.200" : undefined}
          color="greensoft.600"
          {...props}
        >
          <Checkbox />
          <Box>
            <Text fontSize="zeta" fontWeight={modeBadge ? "bold" : undefined}>
              {modeBadge ? "Données transmises" : "Transmet"}
            </Text>
            <Text fontSize="x-small">
              {modeBadge && "Dernière "}MAJ&nbsp;: {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
            </Text>
          </Box>
        </HStack>
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
