import { Heading } from "@chakra-ui/react";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import React from "react";

import { Section } from "../../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../../common/components/tables/RepartitionEffectifsParCfa";
import RepartitionEffectifsParFormation from "../../../../../common/components/tables/RepartitionEffectifsParFormation";
import { filtersPropTypes } from "../../../FiltersContext";
import withRepartitionEffectifsReseauParCfa from "./withRepartitionEffectifsReseauParCfaData";
import withRepartitionEffectifsReseauParNiveauEtAnneeFormation from "./withRepartitionEffectifsReseauParNiveauEtAnneeFormation";

const RepartitionEffectifsReseauParCfa = withRepartitionEffectifsReseauParCfa(RepartitionEffectifsParCfa);
const RepartitionEffectifsReseauParFormation = withRepartitionEffectifsReseauParNiveauEtAnneeFormation(
  RepartitionEffectifsParFormation
);

const RepartitionEffectifsReseau = ({ filters }) => {
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
            formations
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
            <RepartitionEffectifsReseauParFormation filters={filters} />
          </TabPanel>
          <TabPanel padding="0">
            <RepartitionEffectifsReseauParCfa filters={filters} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

RepartitionEffectifsReseau.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsReseau;
