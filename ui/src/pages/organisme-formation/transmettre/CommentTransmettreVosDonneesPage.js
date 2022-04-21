import { Box, Divider, Heading, HStack, Text } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
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
        <HStack spacing="10w">
          <Box width="25%">
            <OrganismeFormationPagesMenu />
          </Box>
          <Divider height="250px" orientation="vertical" marginLeft="5w" />
          <Box>
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
        </HStack>
      </Section>
    </Page>
  );
};

export default CommentTransmettreVosDonneesPage;
