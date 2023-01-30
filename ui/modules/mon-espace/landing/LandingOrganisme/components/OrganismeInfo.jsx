import React from "react";
import { Badge, Box, Heading, HStack, Skeleton, Text } from "@chakra-ui/react";

import { Section } from "../../../../../components/index";
import NatureOrganismeDeFormationWarning from "./NatureOrganismeDeFormationWarning";
import { formatSiretSplitted } from "../../../../../common/utils/stringUtils";
import { organismeAtom } from "../../../../../hooks/organismeAtoms";
import { useRecoilValue } from "recoil";
import IndicateursInfo from "../../common/IndicateursInfos.jsx";
import { SimpleFiltersProvider } from "../../common/SimpleFiltersContext.js";
import Ribbons from "../../../../../components/Ribbons/Ribbons";
import { useEspace } from "../../../../../hooks/useEspace";

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
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  const organisme = useRecoilValue(organismeAtom);

  if (!organisme) {
    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <Skeleton height="2rem" width="250px" marginBottom="2w" />
        <Skeleton height="3rem" width="100%" />
      </Section>
    );
  }

  const {
    _id: organismeId,
    uai,
    nature,
    natureValidityWarning,
    sirets,
    ferme,
    enseigne,
    raison_sociale,
    reseaux,
  } = organisme;
  const siretToDisplay = formatSiretSplitted(sirets[0]);
  // eslint-disable-next-line no-undef
  const uniqReseaux = [...new Set(reseaux)];

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
        <Box>
          <Heading color="grey.800" fontSize="1.6rem" as="h3" mb={2}>
            {enseigne || raison_sociale}
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

          {uniqReseaux?.length > 0 && (
            <HStack fontSize="epsilon" textColor="grey.800" mt={4} spacing="2w">
              <HStack>
                <Text>
                  Cet organisme fait partie
                  <>
                    {uniqReseaux?.length == 1
                      ? ` du réseau ${(<b>uniqReseaux[0]</b>)}`
                      : ` des réseaux </b>${uniqReseaux.join(", ")}</b>`}
                  </>
                </Text>
              </HStack>
            </HStack>
          )}

          {ferme && (
            <Ribbons variant="alert" mt={10}>
              <Box ml={3}>
                <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                  Ce siret est connu comme correspondant à un établissement fermé.
                </Text>
              </Box>
            </Ribbons>
          )}
        </Box>
      </Section>

      <Box mt={5}>
        {!(organisme.first_transmission_date || organisme.mode_de_transmission ) && (
          <Ribbons variant="warning" mt="0.5rem">
            <Box ml={3}>
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                {isMonOrganismePages && "Vous ne nous transmettez pas encore vos effectifs."}
                {isOrganismePages && " Cet organisme ne nous transmet pas encore ses effectifs."}
              </Text>
            </Box>
          </Ribbons>
        )}
        {!organisme.first_transmission_date && organisme.mode_de_transmission && (
          <Ribbons variant="warning" mt="0.5rem">
            <Box ml={3}>
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                {isMonOrganismePages && "Vos effectifs sont en cours de transmission."}
                {isOrganismePages && "Les effectifs de cet organisme sont en cours de transmission."}
              </Text>
            </Box>
          </Ribbons>
        )}
      </Box>
      {organisme.first_transmission_date && (
        <SimpleFiltersProvider initialState={{ organismeId }}>
          <IndicateursInfo />
        </SimpleFiltersProvider>
      )}
    </>
  );
}
