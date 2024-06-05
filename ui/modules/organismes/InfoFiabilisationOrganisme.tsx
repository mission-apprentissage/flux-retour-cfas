import { WarningTwoIcon } from "@chakra-ui/icons";
import { HStack, ListItem, Text, UnorderedList, Link } from "@chakra-ui/react";
import { STATUT_FIABILISATION_ORGANISME } from "shared";
import { REFERENTIEL_ONISEP } from "shared/constants";

import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { Checkbox } from "@/theme/components/icons";

function InfoFiabilisationOrganisme({ fiabilisationStatut }: { fiabilisationStatut?: string }) {
  const FiableTooltip = () => (
    <>
      <Text fontWeight="bold" mb={2}>
        Organisme considéré comme non-fiable si au moins l’une des conditions suivantes est remplie
      </Text>
      <UnorderedList>
        <ListItem>
          L’<strong>UAI</strong> est inconnu ou non-validé dans le{" "}
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
    </>
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
      <InfoTooltip contentComponent={() => <FiableTooltip />} />
    </HStack>
  );
}
export default InfoFiabilisationOrganisme;
