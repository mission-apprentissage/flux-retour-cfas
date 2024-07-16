import { Box, Container, Flex, Heading, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

import SimplePage from "@/components/Page/SimplePage";
import AideCodeRncp from "@/modules/aide/AideCodeRncp";
import AideNature from "@/modules/aide/AideNature";
import AideQualiopi from "@/modules/aide/AideQualiopi";
import AideSiret from "@/modules/aide/AideSiret";
import AideUai from "@/modules/aide/AideUai";

const tabNames = ["Siret", "UAI", "Nature", "Qualiopi", "Code-RNCP"];

export default function ReferencementOrganisme() {
  const router = useRouter();
  const { section } = router.query;

  const sectionString =
    typeof section === "string" ? section.toLowerCase() : section?.[0].toLowerCase() || tabNames[0].toLowerCase();
  const currentIndex =
    tabNames.map((name) => name.toLowerCase()).indexOf(sectionString) === -1
      ? 0
      : tabNames.map((name) => name.toLowerCase()).indexOf(sectionString);

  const handleTabChange = (index: number) => {
    router.push(`/referencement-organisme?section=${tabNames[index].toLowerCase()}`, undefined, { shallow: true });
  };

  return (
    <SimplePage title="Tableau de bord de l’apprentissage">
      <Container maxW="xl" py="10" gap="16">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={6}>
          Comment bien référencer son établissement et ses formations ?
        </Heading>

        <Flex>
          <Box flex="2">
            <Text>
              Les informations d&apos;identification de votre établissement doivent être complètes et correctes pour
              transmettre vos effectifs au Tableau de bord de l&apos;apprentissage. L&apos;équipe du Tableau de bord ne
              peut pas les modifier directement. Voici les démarches que vous devez effectuer selon la donnée à
              modifier.
            </Text>
          </Box>
          <Box flex="1"></Box>
        </Flex>
        <Tabs index={currentIndex} onChange={handleTabChange} my="12">
          <TabList>
            {tabNames.map((tabName) => (
              <Tab key={tabName} fontWeight="bold">
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
      </Container>
    </SimplePage>
  );
}
