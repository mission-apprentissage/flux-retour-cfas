import { Container, Heading, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { GraphIcon } from "@/modules/dashboard/icons";
import IndicateursForm from "@/modules/indicateurs/IndicateursForm";
import IndicateursGraphs from "@/modules/indicateurs/IndicateursGraphs";

function SesIndicateursPage() {
  const router = useRouter();
  if (!router.isReady) {
    return <></>;
  }
  return (
    <SimplePage title="Ses indicateurs">
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Ses indicateurs
        </Heading>

        <Tabs isLazy lazyBehavior="keepMounted" mt={8}>
          <TabList>
            <Tab fontWeight="bold">Vue globale</Tab>
            <Tab fontWeight="bold" isDisabled>
              <GraphIcon />
              <Text ml={2}>Vue graphique (bientôt disponible)</Text>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px="0">
              <IndicateursForm organismeId={router.query.organismeId as string} />
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

export default withAuth(SesIndicateursPage);
