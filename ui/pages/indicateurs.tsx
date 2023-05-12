import { Container, Heading, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { GraphIcon } from "@/modules/dashboard/icons";
import IndicateursForm from "@/modules/indicateurs/IndicateursForm";
import IndicateursGraphs from "@/modules/indicateurs/IndicateursGraphs";

function IndicateursPage() {
  return (
    <SimplePage>
      <Head>
        <title>Mes indicateurs</title>
      </Head>

      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Mes indicateurs
        </Heading>

        <Tabs isLazy lazyBehavior="keepMounted" mt={8}>
          <TabList>
            <Tab fontWeight="bold">Vue globale</Tab>
            <Tab fontWeight="bold">
              <GraphIcon />
              <Text ml={2}>Vue graphique</Text>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px="0">
              <IndicateursForm />
            </TabPanel>
            <TabPanel px="0">
              <IndicateursGraphs />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </SimplePage>
  );
}

export default withAuth(IndicateursPage);
