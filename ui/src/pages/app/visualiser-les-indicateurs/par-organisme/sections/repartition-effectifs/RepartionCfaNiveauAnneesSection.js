import { Box, Flex, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";

import { ExportRepartitionByFormationButton, Section } from "../../../../../../common/components";
import RepartitionEffectifsParFormation from "../../../../../../common/components/tables/RepartitionEffectifsParFormation";
import useFetchEffectifsParNiveauFormation from "../../../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import { filtersPropTypes } from "../../../../../app/visualiser-les-indicateurs/FiltersContext";

const RepartionCfaNiveauAnneesSection = ({ filters }) => {
  const { data, loading, error } = useFetchEffectifsParNiveauFormation(filters);

  return (
    <Section paddingY="4w">
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList>
          <Tab>
            <Box as="i" className="ri-book-mark-fill" marginRight="1v" paddingTop="2px" verticalAlign="middle" />
            Répartition par formations
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel paddingTop="4w">
            <Flex justifyContent="space-between" marginBottom="3w">
              <Heading as="h3" variant="h3">
                Liste des formations par niveau
              </Heading>
              <ExportRepartitionByFormationButton />
            </Flex>
            <RepartitionEffectifsParFormation repartitionEffectifs={data} loading={loading} error={error} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

RepartionCfaNiveauAnneesSection.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartionCfaNiveauAnneesSection;
