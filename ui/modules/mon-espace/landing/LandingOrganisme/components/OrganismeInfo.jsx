import React from "react";
import { Badge, Box, Heading, HStack, Skeleton, Text } from "@chakra-ui/react";

import { Section } from "../../../../../components/index";
import NatureOrganismeDeFormationWarning from "./NatureOrganismeDeFormationWarning";
import { formatSiretSplitted } from "../../../../../common/utils/stringUtils";
import { organismeAtom } from "../../../../../hooks/organismeAtoms";
import { useRecoilValue } from "recoil";
import { SimpleFiltersProvider } from "../SimpleFiltersContext.js";
import OrganismeIndicateursInfo from "./OrganismeIndicateursInfos.jsx";

export const mapNatureOrganismeDeFormation = (nature) => {
  switch (nature) {
    case "responsable":
      return "Responsable";
    case "formateur":
      return "Formateur";
    case "responsable_formateur":
      return "Responsable et formateur";
    default:
      return "Inconnue";
  }
};

export default function OrganismeInfo() {
  const organisme = useRecoilValue(organismeAtom);

  if (!organisme) {
    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <Skeleton height="2rem" width="250px" marginBottom="2w" />
        <Skeleton height="3rem" width="100%" />
      </Section>
    );
  }

  const { _id: organismeId, nom, uai, nature, natureValidityWarning, sirets } = organisme;
  const siretToDisplay = formatSiretSplitted(sirets[0]);

  return (
    <>
      <Section
        borderTop="solid 1px"
        borderTopColor="grey.300"
        borderBottom="solid 1px"
        borderBottomColor="grey.300"
        backgroundColor="galt"
        paddingY="2w"
        mt={4}
        mb={4}
      >
        <Box mb={"85px"}>
          <Heading color="grey.800" fontSize="1.6rem" as="h3" mb={2}>
            {nom}
          </Heading>
          <HStack fontSize="epsilon" textColor="grey.800" spacing="2w">
            <HStack>
              <Text>UAI :</Text>
              <Badge fontSize="epsilon" textColor="grey.800" paddingX="1w" paddingY="2px" backgroundColor="#ECEAE3">
                {uai}
              </Badge>
            </HStack>

            <HStack>
              <Text>SIRET :</Text>
              <Badge fontSize="epsilon" textColor="grey.800" paddingX="1w" paddingY="2px" backgroundColor="#ECEAE3">
                {siretToDisplay}
              </Badge>
            </HStack>

            <HStack>
              <Text>Nature :</Text>
              <Badge
                fontSize="epsilon"
                textTransform="none"
                textColor="grey.800"
                paddingX="1w"
                paddingY="2px"
                backgroundColor="#ECEAE3"
              >
                {mapNatureOrganismeDeFormation(nature)}
              </Badge>
              {natureValidityWarning && <NatureOrganismeDeFormationWarning />}
            </HStack>
          </HStack>
        </Box>
      </Section>

      <SimpleFiltersProvider initialState={{ uai, organismeId }}>
        <OrganismeIndicateursInfo />
      </SimpleFiltersProvider>
    </>
  );
}
