import { Box, Heading } from "@chakra-ui/react";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import React from "react";

import { Section } from "../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import RepartitionEffectifsParFormation from "../../../../common/components/tables/RepartitionEffectifsParFormation";
import useFetchEffectifsParCfa from "../../../../common/hooks/useFetchEffectifsParCfa";
import { filtersPropTypes } from "../../FiltersContext";
import withRepartitionEffectifsReseauParNiveauEtAnneeFormation from "./withRepartitionEffectifsReseauParNiveauEtAnneeFormation";

const RepartitionEffectifsReseauParFormation = withRepartitionEffectifsReseauParNiveauEtAnneeFormation(
  RepartitionEffectifsParFormation
);

const RepartitionEffectifsReseau = ({ filters }) => {
  const {
    data: effectifsParCfa,
    loading: isEffectifsParCfaLoading,
    error: effectifsParCfaError,
  } = useFetchEffectifsParCfa(filters);

  return (
    <Section paddingY="4w">
      <Heading as="h3" variant="h3">
        Répartition des effectifs
      </Heading>
      <Tabs isLazy lazyBehavior="keepMounted">
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
            <RepartitionEffectifsParCfa
              repartitionEffectifsParCfa={effectifsParCfa}
              loading={isEffectifsParCfaLoading}
              error={effectifsParCfaError}
            />
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
