import { Box, Heading } from "@chakra-ui/react";
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
      <Heading as="h3" textStyle="h3">
        Répartition des effectifs
      </Heading>
      <Tabs>
        <TabList>
          <Tab>
            <Box as="i" className="ri-community-fill" marginRight="1v" paddingTop="2px" verticalAlign="middle" />
            Organismes de formation
          </Tab>
          <Tab>
            <Box as="i" className="ri-book-mark-fill" marginRight="1v" paddingTop="2px" verticalAlign="middle" />
            Formations
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <RepartitionEffectifsReseauParCfa filters={filters} />
          </TabPanel>
          <TabPanel>
            <RepartitionEffectifsReseauParFormation filters={filters} />
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
