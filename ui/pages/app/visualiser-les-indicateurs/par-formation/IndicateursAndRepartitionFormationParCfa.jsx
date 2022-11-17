import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "../../../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { Section } from "../../../../components";
import { filtersPropTypes } from "../../../../components/_pagesComponents/FiltersContext.js";
import DownloadBlock from "../../../../components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsParCfa from "../../../../components/tables/RepartitionEffectifsParCfa";
import useFetchEffectifsParCfa from "../../../../hooks/useFetchEffectifsParCfa";
import useFetchOrganismesCount from "../../../../hooks/useFetchOrganismesCount";
import DateWithTooltipSelector from "../DateWithTooltipSelector";
import IndicateursGridStack from "../IndicateursGridStack";

const IndicateursAndRepartitionFormationParCfa = ({ filters, effectifs, loading }) => {
  const { data, isLoading, error } = useFetchEffectifsParCfa(filters);
  const { data: organismesCount } = useFetchOrganismesCount(filters);

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
              <Stack>
                <DateWithTooltipSelector />
                <IndicateursGridStack
                  effectifs={effectifs}
                  loading={loading}
                  organismesCount={organismesCount}
                  effectifsDate={filters.date}
                />
              </Stack>
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
  effectifs: PropTypes.shape({
    apprentis: PropTypes.PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.PropTypes.number.isRequired,
    abandons: PropTypes.PropTypes.number.isRequired,
    rupturants: PropTypes.PropTypes.number.isRequired,
  }),
};

export default IndicateursAndRepartitionFormationParCfa;
