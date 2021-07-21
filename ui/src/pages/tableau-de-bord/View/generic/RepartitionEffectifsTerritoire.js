import { Box, Heading } from "@chakra-ui/react";
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
            Niveaux de formation
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <RepartitionEffectifsTerritoireParCfa filters={filters} />
          </TabPanel>
          <TabPanel>
            <RepartitionEffectifsTerritoireParNiveauFormation filters={filters} />
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
