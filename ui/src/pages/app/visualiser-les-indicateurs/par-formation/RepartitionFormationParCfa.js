import { Box, Flex, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";

import { ExportRepartitionByOrganismeButton, Section } from "../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import useFetchEffectifsParCfa from "../../../../common/hooks/useFetchEffectifsParCfa";
import { filtersPropTypes } from "../FiltersContext";

const RepartitionFormationParCfa = ({ filters }) => {
  const { data, isLoading, error } = useFetchEffectifsParCfa(filters);

  return (
    <Section paddingY="4w">
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList>
          <Tab>
            <Box as="i" className="ri-book-mark-fill" marginRight="1v" paddingTop="2px" verticalAlign="middle" />
            Répartition par organismes de formation
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel paddingTop="4w">
            <Flex justifyContent="space-between" marginBottom="3w">
              <Heading as="h3" variant="h3">
                Liste des organismes de formation
              </Heading>
              <ExportRepartitionByOrganismeButton />
            </Flex>
            <RepartitionEffectifsParCfa repartitionEffectifsParCfa={data} loading={isLoading} error={error} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

RepartitionFormationParCfa.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionFormationParCfa;
