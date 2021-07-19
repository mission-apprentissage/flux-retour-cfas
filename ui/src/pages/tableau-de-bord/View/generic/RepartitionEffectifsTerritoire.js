import { Heading } from "@chakra-ui/react";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import React from "react";

import { Section } from "../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import RepartitionEffectifsParNiveauFormation from "../../../../common/components/tables/RepartitionEffectifsParNiveauFormation";
import { filtersPropTypes } from "../../FiltersContext";
import withRepartitionEffectifsTerritoireParCfa from "./withRepartitionEffectifsTerritoireParCfaData";
import withRepartitionEffectifsTerritoireParNiveauFormation from "./withRepartitionEffectifsTerritoireParNiveauFormation";

const RepartitionEffectifsTerritoireParCfa = withRepartitionEffectifsTerritoireParCfa(RepartitionEffectifsParCfa);
const RepartitionEffectifsTerritoireParNiveauFormation = withRepartitionEffectifsTerritoireParNiveauFormation(
  RepartitionEffectifsParNiveauFormation
);

const RepartitionEffectifsTerritoire = ({ filters }) => {
  return (
    <Section paddingY="4w">
      <Heading as="h3" textStyle="h3" marginBottom="2w">
        Répartition des effectifs
      </Heading>
      <Tabs
        variant="unstyled"
        _selected={{ borderBottom: "3px solid", borderBottomColor: "bluefrance", color: "grey.800" }}
      >
        <TabList color="gray.600" marginBottom="2w">
          <Tab
            padding="0"
            paddingY="1rem"
            marginRight="1rem"
            _selected={{ borderBottom: "3px solid", borderBottomColor: "bluefrance", color: "grey.800" }}
          >
            niveaux de formation
          </Tab>
          <Tab
            padding="0"
            paddingY="1rem"
            marginRight="1rem"
            _selected={{ borderBottom: "3px solid", borderBottomColor: "bluefrance", color: "grey.800" }}
          >
            organismes de formation
          </Tab>
        </TabList>
        <TabPanels padding="0">
          <TabPanel padding="0">
            <RepartitionEffectifsTerritoireParNiveauFormation filters={filters} />
          </TabPanel>
          <TabPanel padding="0">
            <RepartitionEffectifsTerritoireParCfa filters={filters} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

RepartitionEffectifsTerritoire.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsTerritoire;
