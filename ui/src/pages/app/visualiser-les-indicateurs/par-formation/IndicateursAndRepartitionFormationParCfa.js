import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "../../../../common/api/tableauDeBord";
import { Section } from "../../../../common/components";
import DownloadBlock from "../../../../common/components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import useFetchEffectifsParCfa from "../../../../common/hooks/useFetchEffectifsParCfa";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { filtersPropTypes } from "../FiltersContext";
import IndicateursGridStack from "../IndicateursGridStack";

const IndicateursAndRepartitionFormationParCfa = ({ filters, effectifs, loading, showOrganismesCount = true }) => {
  const { data, isLoading, error } = useFetchEffectifsParCfa(filters);

  const exportFilename = `tdb-données-formation-${filters.formation?.cfd}-${new Date().toLocaleDateString()}.csv`;

  return (
    <Section paddingY="4w" marginTop="-85px">
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList borderBottom="0px">
          <Tab fontWeight="bold" fontSize="delta">
            Vue globale
          </Tab>
          <Tab fontWeight="bold" fontSize="delta">
            Effectifs par organismes de formation
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel paddingTop="4w">
            <Stack spacing="4w">
              <IndicateursGridStack effectifs={effectifs} loading={loading} showOrganismesCount={showOrganismesCount} />
              <DownloadBlock
                title="Télécharger les données de la formation sélectionnée"
                description="Le fichier est généré à date du jour, en fonction de la formation sélectionnée et comprend la liste anonymisée des apprenants par organisme et formation."
                fileName={exportFilename}
                getFile={() => fetchEffectifsDataListCsvExport(mapFiltersToApiFormat(filters))}
              />
            </Stack>
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
