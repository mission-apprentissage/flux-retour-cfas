import { Box, Heading } from "@chakra-ui/react";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import React from "react";

import { Section } from "../../../../common/components";
import RepartitionEffectifsParDepartement from "../../../../common/components/tables/RepartitionEffectifsParDepartement";
import RepartitionEffectifsParNiveauFormation from "../../../../common/components/tables/RepartitionEffectifsParNiveauFormation";
import useFetchEffectifsParDepartement from "../../../../common/hooks/useFetchEffectifsParDepartement";
import useFetchEffectifsParNiveauFormation from "../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import { filtersPropTypes } from "../../FiltersContext";

const RepartitionEffectifsRegion = ({ filters }) => {
  const {
    data: effectifsParDepartement,
    loading: isEffectifsParDepartementLoading,
    error: effectifsParDepartementError,
  } = useFetchEffectifsParDepartement(filters);
  const {
    data: effectifsParNiveauFormation,
    loading: isEffectifsParNiveauFormationLoading,
    error: effectifsParNiveauFormationError,
  } = useFetchEffectifsParNiveauFormation(filters);

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
            Niveaux de formation
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <RepartitionEffectifsParDepartement
              effectifs={effectifsParDepartement}
              loading={isEffectifsParDepartementLoading}
              error={effectifsParDepartementError}
            />
          </TabPanel>
          <TabPanel>
            <RepartitionEffectifsParNiveauFormation
              repartitionEffectifs={effectifsParNiveauFormation}
              isEffectifsParNiveauFormationLoading={isEffectifsParNiveauFormationLoading}
              error={effectifsParNiveauFormationError}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

RepartitionEffectifsRegion.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsRegion;
