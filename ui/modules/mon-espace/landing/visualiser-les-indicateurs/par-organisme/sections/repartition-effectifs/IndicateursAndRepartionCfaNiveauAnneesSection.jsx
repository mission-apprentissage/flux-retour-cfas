import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "@/common/api/tableauDeBord";
import { hasUserRoles, roles } from "@/common/auth/roles";
import Section from "@/components/Section/Section";
import DownloadBlock from "@/components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsParFormation from "@/components/tables/RepartitionEffectifsParFormation";
import useAuth from "@/hooks/useAuth";
import useFetchEffectifsParNiveauFormation from "@/hooks/useFetchEffectifsParNiveauFormation";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import DateWithTooltipSelector from "../../../DateWithTooltipSelector";
import { filtersPropTypes } from "../../../FiltersContext";
import IndicateursGridStack from "../../../IndicateursGridStack";

const IndicateursAndRepartionCfaNiveauAnneesSection = ({
  filters,
  effectifs,
  loading,
  hasMultipleSirets = false,
  namedDataDownloadMode = false,
}) => {
  const { data, loading: repartitionLoading, error } = useFetchEffectifsParNiveauFormation(filters);

  const exportFilename = `tdb-données-cfa-${filters.cfa?.uai_etablissement}-${new Date().toLocaleDateString()}.csv`;

  const [auth] = useAuth();
  const allowDownloadNamedData = hasUserRoles(auth, roles.administrator) || namedDataDownloadMode === true;

  // enable namedDataMode if needed
  const fetchEffectifsDataListQueryParams =
    allowDownloadNamedData === true
      ? { ...mapFiltersToApiFormat(filters), namedDataMode: true }
      : mapFiltersToApiFormat(filters);

  return (
    <Section paddingY="4w" marginTop={!hasMultipleSirets ? "-85px" : ""}>
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList borderBottom={!hasMultipleSirets ? "0px" : "1px solid"}>
          <Tab fontWeight="bold" fontSize="delta">
            Vue globale
          </Tab>
          <Tab fontWeight="bold" fontSize="delta">
            Effectifs par formations
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
                description={`Le fichier est généré à date du jour, en fonction de l’organisme sélectionnée et comprend la liste ${
                  allowDownloadNamedData === false ? "anonymisée" : " "
                } des apprenants par organisme et formation.`}
                fileName={exportFilename}
                getFile={() => fetchEffectifsDataListCsvExport(fetchEffectifsDataListQueryParams)}
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
  namedDataDownloadMode: PropTypes.bool,
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

export default IndicateursAndRepartionCfaNiveauAnneesSection;
