import Head from "next/head";
import React from "react";
import { Box, Container, Divider, Flex, Heading, Text } from "@chakra-ui/react";

import { Page } from "../../components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import OrganismeFormationPagesMenu from "../../modules/organisme-formation/OrganismeFormationPagesMenu";
import DemandeBranchementErpFormBlock from "../../modules/organisme-formation/DemandeBranchementErp/DemandeBranchementErpFormBlock";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";

const CommentTransmettreVosDonneesPage = () => {
  const title = "Comment transmettre les données de votre organisme ?";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb
            pages={[
              { title: "Accueil", to: "/" },
              { title: "Vous êtes un organisme de formation", to: "/organisme-formation" },
              { title: title },
            ]}
          />

          <Box paddingTop="5w" marginBottom="10w">
            <Flex>
              <Box width="25%" marginRight="5w">
                <OrganismeFormationPagesMenu />
              </Box>
              <Divider height="250px" orientation="vertical" marginX="5w" />
              <Box marginLeft="5w">
                <Box color="grey.800" fontSize="gamma">
                  <Heading as="h1" fontSize="alpha">
                    {NAVIGATION_PAGES.OrganismeFormation.transmettre.title}
                  </Heading>
                  <Text marginBottom="2w" color="black">
                    Afin de mieux vous guider, merci de renseigner le formulaire ci dessous :
                  </Text>
                  <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" minWidth="420px">
                    <DemandeBranchementErpFormBlock />
                  </Box>
                </Box>
              </Box>
            </Flex>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default CommentTransmettreVosDonneesPage;
