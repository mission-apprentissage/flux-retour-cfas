import { Box, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import React from "react";

import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import { BreadcrumbNav, Page, Section } from "../../../components";
import OrganismeFormationPagesMenu from "../OrganismeFormationPagesMenu";
import DemandeBranchementErpFormBlock from "./DemandeBranchementErp/DemandeBranchementErpFormBlock";

const CommentTransmettreVosDonneesPage = () => {
  return (
    <Page>
      <Section withShadow paddingTop="3w">
        <BreadcrumbNav
          links={[
            NAVIGATION_PAGES.Accueil,
            NAVIGATION_PAGES.OrganismeFormation,
            NAVIGATION_PAGES.OrganismeFormation.transmettre,
          ]}
        />
      </Section>
      <Section paddingTop="5w" marginBottom="10w">
        <Flex>
          <Box width="25%" marginRight="5w">
            <OrganismeFormationPagesMenu />
          </Box>
          <Divider height="250px" orientation="vertical" marginX="5w" />
          <Box marginLeft="5w">
            <Section color="grey.800" fontSize="gamma">
              <Heading as="h1" fontSize="alpha">
                {NAVIGATION_PAGES.OrganismeFormation.transmettre.title}
              </Heading>
              <Text marginBottom="2w" color="black">
                Afin de mieux vous guider, merci de renseigner le formulaire ci dessous :
              </Text>
              <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" minWidth="420px">
                <DemandeBranchementErpFormBlock />
              </Box>
            </Section>
          </Box>
        </Flex>
      </Section>
    </Page>
  );
};

export default CommentTransmettreVosDonneesPage;
