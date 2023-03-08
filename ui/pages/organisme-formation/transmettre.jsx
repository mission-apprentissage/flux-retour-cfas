import Head from "next/head";
import React from "react";
import { Box, Divider, Heading, HStack, Text } from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import OrganismeFormationPagesMenu from "@/modules/organisme-formation/OrganismeFormationPagesMenu";
import DemandeBranchementErpFormBlock from "@/modules/organisme-formation/DemandeBranchementErp/DemandeBranchementErpFormBlock";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";

const CommentTransmettreVosDonneesPage = () => {
  const title = "Comment transmettre les données de votre organisme ?";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Breadcrumb
          pages={[
            PAGES.homepage(),
            { title: "Vous êtes un organisme de formation", to: "/organisme-formation" },
            { title },
          ]}
        />

        <Box paddingTop="5w">
          <HStack spacing={["0", "0", "0", "0", "4w"]} flexDirection={["column", "column", "column", "column", "row"]}>
            <Box alignSelf="flex-start" width={["100%", "100%", "100%", "100%", "34%"]}>
              <OrganismeFormationPagesMenu />
            </Box>
            <Divider
              height="250px"
              orientation="vertical"
              alignSelf="flex-start"
              display={["none", "none", "none", "none", "inline-block"]}
            />
            <Box alignSelf="start" marginLeft={["0", "0", "0", "0", "5w"]}>
              <Box color="grey.800" fontSize="gamma" marginY={["4w", "4w", "4w", "4w", "0"]}>
                <Heading as="h1" fontSize="alpha">
                  Comment transmettre les données de votre organisme ?
                </Heading>
                <Text marginBottom="2w" color="black">
                  Afin de mieux vous guider, merci de renseigner le formulaire ci dessous :
                </Text>
                <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" minWidth="420px">
                  <DemandeBranchementErpFormBlock />
                </Box>
              </Box>
            </Box>
          </HStack>
        </Box>
      </Section>
    </Page>
  );
};

export default CommentTransmettreVosDonneesPage;
