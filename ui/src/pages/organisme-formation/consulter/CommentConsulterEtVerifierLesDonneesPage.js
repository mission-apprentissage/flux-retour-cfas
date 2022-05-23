import { Box, Divider, Heading, HStack, Link, Text } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { BreadcrumbNav, Page, Section } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import OrganismeFormationPagesMenu from "../OrganismeFormationPagesMenu";
import AskUniqueURLModalContent from "./AskUniqueURL/AskUniqueURLModalContent";
const CommentConsulterEtVerifierLesDonneesPage = () => {
  return (
    <Page>
      <Section withShadow paddingTop="3w">
        <BreadcrumbNav
          links={[
            NAVIGATION_PAGES.Accueil,
            NAVIGATION_PAGES.OrganismeFormation,
            NAVIGATION_PAGES.OrganismeFormation.consulter,
          ]}
        />
      </Section>
      <Section paddingTop="5w" marginBottom="10w">
        <HStack spacing="10w">
          <Box alignSelf="flex-start" width="34%">
            <OrganismeFormationPagesMenu />
          </Box>
          <Divider height="250px" orientation="vertical" marginLeft="5w" alignSelf="flex-start" />
          <Box>
            <Section color="grey.800" fontSize="gamma">
              <Heading as="h1" fontSize="alpha">
                Comment consulter et vérifier les données que vous transmettez ?
              </Heading>
              <Text marginTop="3w">
                Vous pouvez accéder sur le Tableau de bord de l’apprentissage, à
                <strong>
                  {" "}
                  une page dédiée à votre organisme de formation via une URL unique disponible dans votre ERP (ou
                  logiciel de gestion)
                </strong>
                . Cette URL est privée, ne la partagez qu’avec les personnes gestionnaires de votre organisme de
                formation.
                <Link color="bluefrance" fontWeight="bold" to="/organisme-formation/aide" as={NavLink}>
                  {" "}
                  Pour plus d’informations, consultez la rubrique d’aide.
                </Link>
              </Text>
              <Heading as="h1" fontSize="alpha" marginTop="4w">
                Comment consulter et vérifier les données que vous transmettez ?
              </Heading>
              <Text marginTop="2w">Renseigner les informations suivantes pour vérifier la transmission :</Text>
              <Box marginTop="2w" padding="4w" paddingBottom="15w" border="1px solid" borderColor="bluefrance">
                <AskUniqueURLModalContent />
              </Box>
            </Section>
          </Box>
        </HStack>
      </Section>
    </Page>
  );
};

export default CommentConsulterEtVerifierLesDonneesPage;
