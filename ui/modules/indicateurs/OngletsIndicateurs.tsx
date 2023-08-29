import { Container, Heading, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { _get } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";
import useAuth from "@/hooks/useAuth";

import { GraphIcon } from "../dashboard/icons";

import IndicateursForm from "./IndicateursForm";
import IndicateursGraphs from "./IndicateursGraphs";
import { canViewOngletIndicateursVueGraphique } from "./permissions-onglet-graphique";

// L'ordre est celui des tabs
const tabs = [
  {
    key: "indicateurs",
    route: "/indicateurs",
    index: 0,
  },
  {
    key: "indicateurs-graphiques",
    route: "/indicateurs/graphiques",
    index: 1,
  },
] as const;

interface OngletsIndicateursProps {
  modePublique: boolean;
  activeTab: (typeof tabs)[number]["key"];
  error?: string;
  iframeUrl?: string;
}

function OngletsIndicateurs(props: OngletsIndicateursProps) {
  const router = useRouter();
  const { organisationType } = useAuth();

  const title = `${props.modePublique ? "Ses" : "Mes"} indicateurs${
    props.activeTab === "indicateurs-graphiques" ? " - vue graphique" : ""
  }`;

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          {props.modePublique ? "Ses" : "Mes"} indicateurs
        </Heading>

        <Tabs
          isLazy
          lazyBehavior="keepMounted"
          index={tabs.find((tab) => tab.key === props.activeTab)?.index}
          onChange={(index) => {
            router.push(
              {
                pathname: tabs[index]?.route,
              },
              undefined,
              {
                shallow: true,
              }
            );
          }}
          mt={8}
        >
          <TabList>
            <Tab fontWeight="bold">Vue globale</Tab>
            <Tab fontWeight="bold" isDisabled={!canViewOngletIndicateursVueGraphique(organisationType)}>
              <GraphIcon />
              <Text ml={2}>
                Vue graphique{!canViewOngletIndicateursVueGraphique(organisationType) && " (bientôt disponible)"}
              </Text>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px="0">
              <IndicateursForm />
            </TabPanel>
            <TabPanel px="0">
              <IndicateursGraphs error={props.error} iframeUrl={props.iframeUrl} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </SimplePage>
  );
}

export default OngletsIndicateurs;
