import { Box, Container, Flex, Heading, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PlausibleGoalType, plausibleGoals } from "shared/constants/plausible-goals";

import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";

import AideCodeRncp from "./tabs/AideCodeRncp";
import AideNature from "./tabs/AideNature";
import AideQualiopi from "./tabs/AideQualiopi";
import AideSiret from "./tabs/AideSiret";
import AideUai from "./tabs/AideUai";

const tabNames = ["Siret", "UAI", "Nature", "Qualiopi", "Code RNCP"];

export default function ReferencementOrganisme() {
  const router = useRouter();
  const { trackPlausibleEvent } = usePlausibleTracking();
  const [isClient, setIsClient] = useState(false);
  const { auth } = useAuth();
  const { section } = router.query;

  useEffect(() => {
    // Régle le problème d'hydratation des tabs: https://nextjs.org/docs/messages/react-hydration-error
    setIsClient(true);
  }, []);

  const sectionString = typeof section === "string" ? section.toLowerCase() : tabNames[0].toLowerCase();
  const currentIndex =
    tabNames.map((name) => name.toLowerCase()).indexOf(sectionString) === -1
      ? 0
      : tabNames.map((name) => name.toLowerCase()).indexOf(sectionString);

  const handleTabChange = (index: number) => {
    router.push(`/referencement-organisme?section=${tabNames[index].toLowerCase()}`, undefined, { shallow: true });
  };

  const trackEventTab = (tabName: string) => {
    const eventName = `referencement_clic_onglet_${tabName.toLowerCase().replace(/\s+/g, "_")}` as PlausibleGoalType;
    if ((plausibleGoals as readonly string[]).includes(eventName)) {
      trackPlausibleEvent(eventName, undefined, {
        type_user: auth ? auth.organisation.type : "public",
      });
    }
  };

  return (
    <Container maxW="xl" py="10" gap="16">
      <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={6}>
        Comment bien référencer son établissement et ses formations ?
      </Heading>

      <Flex>
        <Box flex="2">
          <Text>
            Les informations d&apos;identification de votre établissement doivent être complètes et correctes pour
            transmettre vos effectifs au Tableau de bord de l&apos;apprentissage. L&apos;équipe du Tableau de bord ne
            peut pas les modifier directement. Voici les démarches que vous devez effectuer selon la donnée à modifier.
          </Text>
        </Box>
        <Box flex="1"></Box>
      </Flex>
      {isClient && (
        <Tabs index={currentIndex} onChange={handleTabChange} my="12">
          <TabList>
            {tabNames.map((tabName) => (
              <Tab key={tabName} fontWeight="bold" rel="noopener noreferrer" onClick={() => trackEventTab(tabName)}>
                {tabName}
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            <TabPanel>
              <AideSiret />
            </TabPanel>
            <TabPanel>
              <AideUai />
            </TabPanel>
            <TabPanel>
              <AideNature />
            </TabPanel>
            <TabPanel>
              <AideQualiopi />
            </TabPanel>
            <TabPanel>
              <AideCodeRncp />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Container>
  );
}
