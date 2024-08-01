import { WarningTwoIcon } from "@chakra-ui/icons";
import { ListItem, Text, UnorderedList, Link } from "@chakra-ui/react";
import { STATUT_FIABILISATION_ORGANISME } from "shared";
import { FAQ_REFERENCER_ETABLISSEMENT, REFERENTIEL_ONISEP } from "shared/constants";

import Tag from "@/components/Tag/Tag";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { Checkbox } from "@/theme/components/icons";

function InfoFiabilisationOrganisme({ fiabilisationStatut }: { fiabilisationStatut?: string }) {
  const FiableTooltip = () => (
    <>
      <Text fontWeight="bold">
        Organisme considéré comme non-fiable si au moins l’une des conditions suivantes est remplie
      </Text>
      <UnorderedList my={2}>
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
      <Link isExternal href={FAQ_REFERENCER_ETABLISSEMENT} textDecoration="underline" display="inline" mt={6}>
        En savoir plus sur la démarche à suivre
      </Link>
    </>
  );
  const isFiable = fiabilisationStatut === STATUT_FIABILISATION_ORGANISME.FIABLE;
  return (
    <Tag
      leftIcon={isFiable ? Checkbox : WarningTwoIcon}
      primaryText={isFiable ? "Organisme fiable" : "Organisme non fiable"}
      variant="badge"
      colorScheme={isFiable ? "green_tag" : "orange_tag"}
      rightIcon={() => <InfoTooltip contentComponent={FiableTooltip} />}
    />
  );
}
export default InfoFiabilisationOrganisme;
