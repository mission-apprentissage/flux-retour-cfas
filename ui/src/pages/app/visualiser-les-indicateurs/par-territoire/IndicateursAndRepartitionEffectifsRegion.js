import { Stack } from "@chakra-ui/react";
import { TabPanel } from "@chakra-ui/tabs";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "../../../../common/api/tableauDeBord";
import { RepartitionEffectifsTabs, Section } from "../../../../common/components";
import DownloadBlock from "../../../../common/components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsParDepartement from "../../../../common/components/tables/RepartitionEffectifsParDepartement";
import RepartitionEffectifsParNiveauFormation from "../../../../common/components/tables/RepartitionEffectifsParNiveauFormation";
import useFetchEffectifsParDepartement from "../../../../common/hooks/useFetchEffectifsParDepartement";
import useFetchEffectifsParNiveauFormation from "../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import useFetchOrganismesCount from "../../../../common/hooks/useFetchOrganismesCount";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import DateWithTooltipSelector from "../DateWithTooltipSelector";
import { filtersPropTypes } from "../FiltersContext";
import IndicateursGridStack from "../IndicateursGridStack";

const IndicateursAndRepartitionEffectifsRegion = ({ filters, effectifs, loading }) => {
  const {
    data: effectifsParDepartement,
    loading: isEffectifsParDepartementLoading,
    error: effectifsParDepartementError,
  } = useFetchEffectifsParDepartement(filters);
  const {
    data: effectifsParNiveauFormation,
    loading: isEffectifsParNiveauFormationLoading,
    error: effectifsParNiveauFormationError,
  } = useFetchEffectifsParNiveauFormation(filters);

  const { data: organismesCount } = useFetchOrganismesCount(filters);

  const exportFilename = `tdb-données-territoire-region-${filters.region?.code}-${new Date().toLocaleDateString()}.csv`;

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
        <TabPanel paddingTop="4w">
          <DateWithTooltipSelector marginBottom="1w" />
          <RepartitionEffectifsParDepartement
            effectifs={effectifsParDepartement}
            loading={isEffectifsParDepartementLoading}
            error={effectifsParDepartementError}
          />
        </TabPanel>
        <TabPanel paddingTop="4w">
          <DateWithTooltipSelector marginBottom="1w" />
          <RepartitionEffectifsParNiveauFormation
            repartitionEffectifs={effectifsParNiveauFormation}
            isEffectifsParNiveauFormationLoading={isEffectifsParNiveauFormationLoading}
            error={effectifsParNiveauFormationError}
          />
        </TabPanel>
      </RepartitionEffectifsTabs>
    </Section>
  );
};

IndicateursAndRepartitionEffectifsRegion.propTypes = {
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
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

export default IndicateursAndRepartitionEffectifsRegion;
