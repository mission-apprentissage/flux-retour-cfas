import { Box, Button, Center, Divider, Flex, Heading, HStack, Spacer, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { BreadcrumbNav, Page, Section } from "../../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../../common/constants/navigationPages.js";
// import useAuth from "../../../../../common/hooks/useAuth.js";
import { NotFound } from "../../../../../theme/components/icons/NotFound.js";

const CfaSifaView = () => {
  // const { auth } = useAuth();
  // const uai = auth?.sub;

  return (
    <Page>
      <Section paddingY="4w" marginBottom="4w">
        {/* Header */}
        <Flex alignItems="center" gap="2">
          <Box>
            <Stack spacing="4w">
              <BreadcrumbNav
                links={[
                  NAVIGATION_PAGES.Accueil,
                  {
                    path: `#`,
                    title: "Cfa",
                  },
                  NAVIGATION_PAGES.Cfa.sifa,
                ]}
              />
              <Heading>Mes données SIFA</Heading>
              <HStack spacing="6w" alignItems="flex-start">
                <Stack width="65%" color="#666666" fontSize="epsilon" spacing="1w">
                  <Text>Formulaire constitué à partir des données que vous avez téléversé.</Text>
                  <Text>
                    Lorsque vous voyez des données indiquées comme étant en erreur, vous pouvez les modifier directement
                    sur la cellule concernée.
                  </Text>
                  <Text>
                    Une fois satisfait, vous pourrez télécharger le fichier que vous aurez mis à jour. Ce fichier est
                    compatible avec Sifa2.
                  </Text>
                </Stack>
                <Box width="30%" backgroundColor="#E8EDFF" borderRadius="10px" padding="4w">
                  <Stack>
                    <HStack color="#0063CB">
                      <Box as="i" className="ri-lightbulb-line" fontSize="gamma" />
                      <Text>
                        <strong>Le saviez-vous ?</strong>
                      </Text>
                    </HStack>
                    <Text>
                      Les erreurs les plus fréquentes partent d’une mauvaise différenciation entre code commune et code
                      de naissance.
                    </Text>
                  </Stack>
                </Box>
              </HStack>
            </Stack>
          </Box>
        </Flex>

        <Divider marginTop="6w" />

        {/* Header Table*/}
        <Flex minWidth="max-content" alignItems="center" gap="2">
          <Box padding="2">
            <Heading fontSize="22px">Erreurs à corriger</Heading>
          </Box>
          <Spacer />
          <Button
            leftIcon={<Box as="i" className="ri-download-fill" />}
            variant="secondary"
            to="#"
            marginTop="2w"
            as={NavLink}
          >
            Télécharger
          </Button>
        </Flex>

        <Center marginTop="8w">
          <NotFound />
        </Center>
      </Section>
    </Page>
  );
};

export default CfaSifaView;
