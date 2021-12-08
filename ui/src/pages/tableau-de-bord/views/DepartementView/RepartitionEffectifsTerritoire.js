import { Box, Heading } from "@chakra-ui/react";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import React from "react";

import { Section } from "../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import RepartitionEffectifsParNiveauFormation from "../../../../common/components/tables/RepartitionEffectifsParNiveauFormation";
import useFetchEffectifsParNiveauFormation from "../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import { filtersPropTypes } from "../../FiltersContext";
import withRepartitionEffectifsTerritoireParCfa from "./withRepartitionEffectifsTerritoireParCfaData";

const RepartitionEffectifsDepartementParCfa = withRepartitionEffectifsTerritoireParCfa(RepartitionEffectifsParCfa);

const RepartitionEffectifsDepartement = ({ filters }) => {
  const {
    data: repartitionEffectifsParNiveauFormation,
    loading: isEffectifsParNiveauFormationLoading,
    error,
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
            <RepartitionEffectifsDepartementParCfa filters={filters} />
          </TabPanel>
          <TabPanel>
            <RepartitionEffectifsParNiveauFormation
              repartitionEffectifs={repartitionEffectifsParNiveauFormation}
              isEffectifsParNiveauFormationLoading={isEffectifsParNiveauFormationLoading}
              error={error}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

RepartitionEffectifsDepartement.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsDepartement;
