import { Stack } from "@chakra-ui/react";
import { TabPanel } from "@chakra-ui/tabs";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "../../../../common/api/tableauDeBord";
import { RepartitionEffectifsTabs, Section } from "../../../../common/components";
import DownloadBlock from "../../../../common/components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import RepartitionEffectifsParFormation from "../../../../common/components/tables/RepartitionEffectifsParFormation";
import useFetchEffectifsParCfa from "../../../../common/hooks/useFetchEffectifsParCfa";
import useFetchEffectifsParNiveauFormation from "../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import useFetchOrganismesCount from "../../../../common/hooks/useFetchOrganismesCount";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import DateWithTooltipSelector from "../DateWithTooltipSelector";
import { filtersPropTypes } from "../FiltersContext";
import IndicateursGridStack from "../IndicateursGridStack";

const IndicateursAndRepartitionEffectifsReseau = ({ filters, effectifs, loading, showOrganismesCount = true }) => {
  const {
    data: effectifsParCfa,
    loading: isEffectifsParCfaLoading,
    error: effectifsParCfaError,
  } = useFetchEffectifsParCfa(filters);

  const {
    data: effectifsParNiveauFormation,
    loading: isEffectifsParNiveauFormationLoading,
    error: effectifsParNiveauFormationError,
  } = useFetchEffectifsParNiveauFormation(filters);

  const { data: organismesCount } = useFetchOrganismesCount(filters);

  const exportFilename = `tdb-données-réseau-${filters.reseau?.nom}-${new Date().toLocaleDateString()}.csv`;

  return (
    <Section paddingY="4w">
      <RepartitionEffectifsTabs>
        <TabPanel paddingTop="4w">
          <Stack spacing="4w">
            <Stack>
              <DateWithTooltipSelector />
              <IndicateursGridStack
                effectifs={effectifs}
                loading={loading}
                organismesCount={organismesCount}
                showOrganismesCount={showOrganismesCount}
                effectifsDate={filters.date}
              />
            </Stack>
            <DownloadBlock
              title="Télécharger les données du réseau sélectionné"
              description="Le fichier est généré à date du jour, en fonction du réseau sélectionné et comprend la liste anonymisée des apprenants par organisme et formation."
              fileName={exportFilename}
              getFile={() => fetchEffectifsDataListCsvExport(mapFiltersToApiFormat(filters))}
            />
          </Stack>
        </TabPanel>
        <TabPanel paddingTop="4w">
          <DateWithTooltipSelector marginBottom="1w" />
          <RepartitionEffectifsParCfa
            repartitionEffectifsParCfa={effectifsParCfa}
            loading={isEffectifsParCfaLoading}
            error={effectifsParCfaError}
          />
        </TabPanel>
        <TabPanel paddingTop="4w">
          <DateWithTooltipSelector marginBottom="1w" />
          <RepartitionEffectifsParFormation
            repartitionEffectifs={effectifsParNiveauFormation}
            loading={isEffectifsParNiveauFormationLoading}
            error={effectifsParNiveauFormationError}
          />
        </TabPanel>
      </RepartitionEffectifsTabs>
    </Section>
  );
};

IndicateursAndRepartitionEffectifsReseau.propTypes = {
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

export default IndicateursAndRepartitionEffectifsReseau;
