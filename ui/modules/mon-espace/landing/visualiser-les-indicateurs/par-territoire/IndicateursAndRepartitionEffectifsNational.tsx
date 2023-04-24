import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "@/common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import DownloadBlock from "@/components/DownloadBlock/DownloadBlock";
import Section from "@/components/Section/Section";
import useFetchOrganismesCount from "@/hooks/useFetchOrganismesCount";

import DateWithTooltipSelector from "../DateWithTooltipSelector";
import { useFiltersContext } from "../FiltersContext";
import { indicateursEffectifsSchema } from "../indicateursEffectifsSchema";
import IndicateursGridStack from "../IndicateursGridStack";

const IndicateursAndRepartitionEffectifsNational = ({ effectifs, loading }) => {
  const { state: filters } = useFiltersContext();
  const { data: organismesCount } = useFetchOrganismesCount(filters);

  const exportFilename = `tdb-données-territoire-national-${new Date().toLocaleDateString()}.csv`;

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
            <Stack spacing="4w">
              <Stack>
                <DateWithTooltipSelector />
                <IndicateursGridStack
                  effectifs={effectifs}
                  loading={loading}
                  organismesCount={organismesCount}
                  showOrganismesCount
                  effectifsDate={filters.date}
                />
              </Stack>
              <DownloadBlock
                title="Télécharger les données du territoire sélectionné"
                description="Le fichier est généré à date du jour, en fonction du territoire sélectionné et comprend la liste anonymisée des apprenants par organisme et formation."
                fileName={exportFilename}
                getFile={() => fetchEffectifsDataListCsvExport(mapFiltersToApiFormat(filters))}
              />
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

IndicateursAndRepartitionEffectifsNational.propTypes = {
  loading: PropTypes.bool.isRequired,
  ...indicateursEffectifsSchema,
};

export default IndicateursAndRepartitionEffectifsNational;
