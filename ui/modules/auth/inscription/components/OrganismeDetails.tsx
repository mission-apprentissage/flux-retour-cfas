import { Text, VStack } from "@chakra-ui/react";

import { natureOrganismeDeFormationLabel } from "@/modules/dashboard/OrganismeInfo";

export default function OrganismeDetails({ organisme }) {
  return (
    <VStack alignItems={"baseline"} spacing={1}>
      <Text>
        UAI : <b>{organisme.uai || "Inconnu"}</b>
      </Text>
      <Text>
        Nature : <b>{natureOrganismeDeFormationLabel[organisme.nature] || "Inconnue"}</b>
      </Text>
      <Text>
        SIRET :{" "}
        <b>
          {organisme.siret} ({organisme.ferme ? "fermé" : "en activité"})
        </b>
      </Text>
      <Text>
        Raison sociale : <b>{organisme.enseigne || organisme.raison_sociale}</b>
      </Text>
      <Text>
        Adresse : <b>{organisme.adresse?.complete}</b>
      </Text>
      {organisme.ferme && <Text color="error">Le SIRET {organisme.siret} est un établissement fermé.</Text>}
    </VStack>
  );
}
