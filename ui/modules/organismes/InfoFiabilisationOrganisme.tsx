import { WarningTwoIcon } from "@chakra-ui/icons";
import { Box, HStack, Text } from "@chakra-ui/react";
import { STATUT_FIABILISATION_ORGANISME } from "shared";

import { Checkbox } from "@/theme/components/icons";

function InfoFiabilisationOrganisme({ fiabilisationStatut }: { fiabilisationStatut?: string }) {
  const isFiable = fiabilisationStatut === STATUT_FIABILISATION_ORGANISME.FIABLE;
  return (
    <HStack
      paddingX="1w"
      paddingY="2px"
      borderRadius={6}
      backgroundColor={isFiable ? "greensoft.200" : "#FF732C1A"}
      color={isFiable ? "greensoft.600" : "#FF732C"}
    >
      {isFiable ? <Checkbox /> : <WarningTwoIcon boxSize={4} />}

      <Box>
        <Text fontSize="zeta" fontWeight="bold">
          {isFiable ? "Organisme fiable" : "Organisme non fiable"}
        </Text>
        <Text fontSize="x-small">
          {isFiable
            ? "Le couple UAI SIRET est présent dans le référentiel "
            : "Le couple UAI SIRET n'est pas présent dans le référentiel"}
        </Text>
      </Box>
    </HStack>
  );
}
export default InfoFiabilisationOrganisme;
