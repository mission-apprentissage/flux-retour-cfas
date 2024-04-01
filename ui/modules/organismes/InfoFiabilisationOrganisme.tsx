import { WarningTwoIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { Box, HStack, ListItem, Text, UnorderedList, Link } from "@chakra-ui/react";
import { STATUT_FIABILISATION_ORGANISME } from "shared";
import { REFERENTIEL_ONISEP } from "shared/constants";

import BasicTooltip from "@/components/InfoTooltip/BasicTooltip";
import { Checkbox } from "@/theme/components/icons";

function InfoFiabilisationOrganisme({ fiabilisationStatut }: { fiabilisationStatut?: string }) {
  const FiableTooltip = () => (
    <Box color="black" minW={400} w={400}>
      <Text fontWeight="bold" mb={2}>
        Organisme considéré comme non-fiable si au moins l’une des conditions suivantes est remplie
      </Text>
      <UnorderedList>
        <ListItem>
          L’<strong>UAI</strong> est inconnu ou non-validé dans le
          <Link isExternal href={REFERENTIEL_ONISEP} textDecoration="underline">
            Référentiel
          </Link>
        </ListItem>
        <ListItem>
          La <strong>nature</strong> (déduite des relations entre organismes) est inconnue : se rapprocher du Carif-Oref
          régional pour la déclarer
        </ListItem>
        <ListItem>
          L’état administratif du <strong>SIRET</strong> de l’établissement, tel qu’il est enregistré auprès de l’INSEE,
          est fermé
        </ListItem>
      </UnorderedList>
    </Box>
  );
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

      <Text fontSize="zeta" fontWeight="bold">
        {isFiable ? "Organisme fiable" : "Organisme non fiable"}
      </Text>
      <BasicTooltip contentComponent={() => <FiableTooltip />} triggerComponent={() => <InfoOutlineIcon />} />
    </HStack>
  );
}
export default InfoFiabilisationOrganisme;
