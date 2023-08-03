import { WarningTwoIcon } from "@chakra-ui/icons";
import { Box, HStack, SystemProps, Text } from "@chakra-ui/react";
import { isBefore, subMonths, subWeeks } from "date-fns";

import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { Checkbox } from "@/theme/components/icons";
import { CloseCircle } from "@/theme/components/icons/CloseCircle";

type BadgeState =
  | "donnees_non_disponibles"
  | "donnees_non_transmises"
  | "donnees_obsoletes"
  | "donnees_anciennes"
  | "donnees_recentes";

interface BadgeTransmissionDonneesProps extends SystemProps {
  lastTransmissionDate?: string;
  permissionInfoTransmissionEffectifs?: boolean;
}
function BadgeTransmissionDonnees({
  lastTransmissionDate,
  permissionInfoTransmissionEffectifs,
  ...props
}: BadgeTransmissionDonneesProps) {
  const state: BadgeState = !permissionInfoTransmissionEffectifs
    ? "donnees_non_disponibles"
    : !lastTransmissionDate
    ? "donnees_non_transmises"
    : isBefore(new Date(lastTransmissionDate), subMonths(new Date(), 3))
    ? "donnees_obsoletes"
    : isBefore(new Date(lastTransmissionDate), subWeeks(new Date(), 1))
    ? "donnees_anciennes"
    : "donnees_recentes";

  switch (state) {
    case "donnees_non_disponibles":
      return (
        <HStack
          paddingX="1w"
          paddingY="2px"
          borderRadius={6}
          fontWeight="bold"
          backgroundColor="dgalt"
          color="mgalt"
          {...props}
        >
          <CloseCircle />
          <Text fontSize="zeta" fontWeight="bold">
            Données non disponibles
          </Text>
        </HStack>
      );
    case "donnees_non_transmises":
      return (
        <HStack
          paddingX="1w"
          paddingY="2px"
          borderRadius={6}
          fontWeight="bold"
          backgroundColor="#E1000F30"
          color="error"
          {...props}
        >
          <CloseCircle />
          <Text fontSize="zeta" fontWeight="bold">
            Données non transmises
          </Text>
        </HStack>
      );
    case "donnees_obsoletes":
      return (
        <HStack paddingX="1w" paddingY="2px" borderRadius={6} backgroundColor="#E631221A" color="#E63122" {...props}>
          <WarningTwoIcon boxSize={5} />
          <Box>
            <Text fontSize="zeta" fontWeight="bold">
              Données obsolètes
            </Text>
            <Text fontSize="x-small">
              Dernière MAJ&nbsp;: {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
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
          fontWeight="bold"
          backgroundColor="#FF732C1A"
          color="#FF732C"
          {...props}
        >
          <Checkbox />
          <Box>
            <Text fontSize="zeta" fontWeight="bold">
              Données transmises
            </Text>
            <Text fontSize="x-small">
              Dernière MAJ&nbsp;: {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
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
          fontWeight="bold"
          backgroundColor="greensoft.200"
          color="greensoft.600"
          {...props}
        >
          <Checkbox />
          <Box>
            <Text fontSize="zeta" fontWeight="bold">
              Données transmises
            </Text>
            <Text fontSize="x-small">
              Dernière MAJ&nbsp;: {formatDateNumericDayMonthYear(lastTransmissionDate as string)}
            </Text>
          </Box>
        </HStack>
      );
  }
}
export default BadgeTransmissionDonnees;
