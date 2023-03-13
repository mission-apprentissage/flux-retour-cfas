import React from "react";
import Head from "next/head";
import { Box, Container, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { NAVIGATION_PAGES } from "@/common/constants/navigationPages";

const StatistiquesPage = () => {
  const title = "Statistiques";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]} backgroundColor="galt" paddingY="8w">
        <Container maxW="xl">
          <Heading as="h1" variant="h1" marginBottom="1w">
            {NAVIGATION_PAGES.Statistiques.title}
          </Heading>
        </Container>
      </Box>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]} paddingTop="3w">
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
        </Container>
      </Box>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]} paddingY="4w">
        <Container maxW="xl">
          <Tabs isLazy lazyBehavior="keepMounted">
            <TabList>
              <Tab>Visites</Tab>
              <Tab>Profils utilisateur</Tab>
              <Tab>Acquisition</Tab>
              <Tab>Qualité des données</Tab>
              <Tab>Couverture</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <iframe
                  // plausible-embed
                  style={{ height: "250vh", width: "100%" }}
                  src="https://plausible.io/share/cfas.apprentissage.beta.gouv.fr?auth=64Z3Ad2odIm3NERPEZbiq&embed=true&theme=light&background=transparent” scrolling=“no” frameborder=“0” loading=“lazy” style=“width: 100%; min-width: 100%; height: 1600px;"
                />
              </TabPanel>
              <TabPanel>
                <iframe
                  src="https://cfas.apprentissage.beta.gouv.fr/metabase/public/dashboard/8af240fe-aaed-466e-a903-537b328a749f"
                  style={{ height: "250vh", width: "100%" }}
                  allowtransparency={"true"}
                />
              </TabPanel>
              <TabPanel>
                <iframe
                  src="https://cfas.apprentissage.beta.gouv.fr/metabase/public/dashboard/3725a628-f37b-4220-8e55-b63241835b13"
                  style={{ height: "1000px", width: "100%" }}
                  allowtransparency={"true"}
                />
              </TabPanel>
              <TabPanel>
                <iframe
                  src="https://cfas.apprentissage.beta.gouv.fr/metabase/public/dashboard/78bc775c-1be5-4e61-b81c-3fe4679e480b"
                  style={{ height: "1450px", width: "100%" }}
                  allowtransparency={"true"}
                />
              </TabPanel>
              <TabPanel>
                <iframe
                  src="https://cfas.apprentissage.beta.gouv.fr/metabase/public/dashboard/9808c918-2d2f-4ae5-b0e7-5e1d982e3e66"
                  style={{ height: "1450px", width: "100%" }}
                  allowtransparency={"true"}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </Page>
  );
};

export default StatistiquesPage;
