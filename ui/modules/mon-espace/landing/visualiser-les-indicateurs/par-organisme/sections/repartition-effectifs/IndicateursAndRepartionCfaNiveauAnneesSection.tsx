import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "@/common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import DownloadBlock from "@/components/DownloadBlock/DownloadBlock";
import Section from "@/components/Section/Section";
import RepartitionEffectifsParFormation from "@/components/tables/RepartitionEffectifsParFormation";
import useFetchEffectifsParNiveauFormation from "@/hooks/useFetchEffectifsParNiveauFormation";

import DateWithTooltipSelector from "../../../DateWithTooltipSelector";
import { filtersPropTypes } from "../../../FiltersContext";
import { indicateursEffectifsSchema } from "../../../indicateursEffectifsSchema";
import IndicateursGridStack from "../../../IndicateursGridStack";

const IndicateursAndRepartionCfaNiveauAnneesSection = ({ filters, effectifs, loading, hasMultipleSirets = false }) => {
  const { data, isLoading: repartitionLoading, error } = useFetchEffectifsParNiveauFormation(filters);

  const exportFilename = `tdb-données-cfa-${filters.cfa?.uai_etablissement}-${new Date().toLocaleDateString()}.csv`;

  return (
    <Section paddingY="4w" marginTop={!hasMultipleSirets ? "-85px" : ""}>
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList borderBottom={!hasMultipleSirets ? "0px" : "1px solid"}>
          <Tab fontWeight="bold" fontSize="delta">
            Vue globale
          </Tab>
          <Tab fontWeight="bold" fontSize="delta">
            Effectifs par niveau
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
                  showOrganismesCount={false}
                  effectifsDate={filters.date}
                />
              </Stack>
              <DownloadBlock
                title="Télécharger les données de l’organisme sélectionné"
                description="Le fichier est généré à date du jour, en fonction de l’organisme sélectionnée et comprend la liste des apprenants par organisme et formation."
                fileName={exportFilename}
                getFile={() => fetchEffectifsDataListCsvExport(mapFiltersToApiFormat(filters))}
              />
            </Stack>
          </TabPanel>
          <TabPanel paddingTop="4w">
            <RepartitionEffectifsParFormation repartitionEffectifs={data} loading={repartitionLoading} error={error} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

IndicateursAndRepartionCfaNiveauAnneesSection.propTypes = {
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  hasMultipleSirets: PropTypes.bool,
  ...indicateursEffectifsSchema,
};

export default IndicateursAndRepartionCfaNiveauAnneesSection;
