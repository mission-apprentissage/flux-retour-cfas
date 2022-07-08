import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../common/components";
import IndicateursGridStack from "../IndicateursGridStack";

const IndicateursAndRepartitionEffectifsNational = ({ effectifs, loading, showOrganismesCount = true }) => {
  return (
    <Section paddingY="4w">
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList>
          <Tab fontWeight="bold" fontSize="delta">
            Vue globale
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel paddingTop="4w">
            <IndicateursGridStack effectifs={effectifs} loading={loading} showOrganismesCount={showOrganismesCount} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

IndicateursAndRepartitionEffectifsNational.propTypes = {
  loading: PropTypes.bool.isRequired,
  showOrganismesCount: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    inscritsSansContrat: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    abandons: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    rupturants: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
  }),
};

export default IndicateursAndRepartitionEffectifsNational;
