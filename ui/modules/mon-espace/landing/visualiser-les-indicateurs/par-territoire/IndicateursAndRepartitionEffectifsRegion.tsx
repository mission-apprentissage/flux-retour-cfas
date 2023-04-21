import { Stack, TabPanel } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import DateWithTooltipSelector from "../DateWithTooltipSelector";
import { filtersPropTypes } from "../FiltersContext";
import { indicateursEffectifsSchema } from "../indicateursEffectifsSchema";
import IndicateursGridStack from "../IndicateursGridStack";

import { fetchEffectifsDataListCsvExport } from "@/common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import DownloadBlock from "@/components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsTabs from "@/components/RepartitionEffectifsTabs/RepartitionEffectifsTabs";
import Section from "@/components/Section/Section";
import RepartitionEffectifsParDepartement from "@/components/tables/RepartitionEffectifsParDepartement";
import RepartitionEffectifsParNiveauFormation from "@/components/tables/RepartitionEffectifsParNiveauFormation";
import useFetchEffectifsParDepartement from "@/hooks/useFetchEffectifsParDepartement";
import useFetchEffectifsParNiveauFormation from "@/hooks/useFetchEffectifsParNiveauFormation";
import useFetchOrganismesCount from "@/hooks/useFetchOrganismesCount";

const IndicateursAndRepartitionEffectifsRegion = ({ filters, effectifs, loading }) => {
  const {
    data: effectifsParDepartement,
    loading: isEffectifsParDepartementLoading,
    error: effectifsParDepartementError,
  } = useFetchEffectifsParDepartement(filters);
  const {
    data: effectifsParNiveauFormation,
    isLoading: isEffectifsParNiveauFormationLoading,
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
            loading={isEffectifsParNiveauFormationLoading}
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
  ...indicateursEffectifsSchema,
};

export default IndicateursAndRepartitionEffectifsRegion;
