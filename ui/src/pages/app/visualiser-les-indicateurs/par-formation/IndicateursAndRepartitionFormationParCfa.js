import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import useFetchEffectifsParCfa from "../../../../common/hooks/useFetchEffectifsParCfa";
import { filtersPropTypes } from "../FiltersContext";
import IndicateursGridStack from "../IndicateursGridStack";

const IndicateursAndRepartitionFormationParCfa = ({
  filters,
  effectifs,
  loading,
  allowDownloadDataList = false,
  showOrganismesCount = true,
}) => {
  const { data, isLoading, error } = useFetchEffectifsParCfa(filters);

  return (
    <Section paddingY="4w">
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList>
          <Tab fontWeight="bold" fontSize="delta">
            Vue globale
          </Tab>
          <Tab fontWeight="bold" fontSize="delta">
            Effectifs par organismes de formation
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel paddingTop="4w">
            <IndicateursGridStack
              effectifs={effectifs}
              loading={loading}
              showOrganismesCount={showOrganismesCount}
              allowDownloadDataList={allowDownloadDataList}
            />
          </TabPanel>
          <TabPanel paddingTop="4w">
            <RepartitionEffectifsParCfa repartitionEffectifsParCfa={data} loading={isLoading} error={error} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

IndicateursAndRepartitionFormationParCfa.propTypes = {
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  allowDownloadDataList: PropTypes.bool,
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

export default IndicateursAndRepartitionFormationParCfa;
