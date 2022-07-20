import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsAnonymizedDataListCsvExport } from "../../../../../../common/api/tableauDeBord";
import { Section } from "../../../../../../common/components";
import DownloadBlock from "../../../../../../common/components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsParFormation from "../../../../../../common/components/tables/RepartitionEffectifsParFormation";
import useFetchEffectifsParNiveauFormation from "../../../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import { mapFiltersToApiFormat } from "../../../../../../common/utils/mapFiltersToApiFormat";
import { filtersPropTypes } from "../../../FiltersContext";
import IndicateursGridStack from "../../../IndicateursGridStack";

const IndicateursAndRepartionCfaNiveauAnneesSection = ({
  filters,
  effectifs,
  loading,
  allowDownloadDataList = false,
  showOrganismesCount = true,
  hasMultipleSirets = false,
}) => {
  const { data, loading: repartitionLoading, error } = useFetchEffectifsParNiveauFormation(filters);
  const exportFilename = `tdb-données-cfa-${filters.cfa?.uai_etablissement}-${new Date().toLocaleDateString()}.csv`;

  return (
    <Section paddingY="4w" marginTop={hasMultipleSirets == false ? "-85px" : ""}>
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList borderBottom={hasMultipleSirets == false ? "0px" : "1px solid"}>
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
              <IndicateursGridStack
                effectifs={effectifs}
                loading={loading}
                showOrganismesCount={showOrganismesCount}
                allowDownloadDataList={allowDownloadDataList}
              />
              <DownloadBlock
                title="Télécharger les données de l’organisme sélectionné"
                description="Le fichier est généré à date du jour, en fonction de l’organisme sélectionnée et comprend la liste anonymisé des apprenants par organisme et formation."
                fileName={exportFilename}
                getFile={() => fetchEffectifsAnonymizedDataListCsvExport(mapFiltersToApiFormat(filters))}
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
  allowDownloadDataList: PropTypes.bool,
  showOrganismesCount: PropTypes.bool,
  hasMultipleSirets: PropTypes.bool,
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
