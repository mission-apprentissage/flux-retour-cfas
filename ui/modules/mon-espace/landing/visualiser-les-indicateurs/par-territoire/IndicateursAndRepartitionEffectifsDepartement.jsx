import { Stack } from "@chakra-ui/react";
import { TabPanel } from "@chakra-ui/tabs";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "@/common/api/tableauDeBord";
import RepartitionEffectifsTabs from "@/components/RepartitionEffectifsTabs/RepartitionEffectifsTabs";
import Section from "@/components/Section/Section";
import DownloadBlock from "@/components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsParCfa from "@/components/tables/RepartitionEffectifsParCfa";
import RepartitionEffectifsParNiveauFormation from "@/components/tables/RepartitionEffectifsParNiveauFormation";
import useFetchEffectifsParCfa from "@/hooks/useFetchEffectifsParCfa";
import useFetchEffectifsParNiveauFormation from "@/hooks/useFetchEffectifsParNiveauFormation";
import useFetchOrganismesCount from "@/hooks/useFetchOrganismesCount";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import DateWithTooltipSelector from "../DateWithTooltipSelector";
import { filtersPropTypes } from "../FiltersContext";
import IndicateursGridStack from "../IndicateursGridStack";
import { indicateursEffectifsSchema } from "../indicateursEffectifsSchema";

const IndicateursAndRepartitionEffectifsDepartement = ({ filters, effectifs, loading }) => {
  const {
    data: effectifsParNiveauFormation,
    loading: isEffectifsParNiveauFormationLoading,
    error: effectifsParNiveauFormationError,
  } = useFetchEffectifsParNiveauFormation(filters);
  const {
    data: effectifsParCfa,
    loading: isEffectifsParCfaLoading,
    error: effectifsParCfaError,
  } = useFetchEffectifsParCfa(filters);

  const { data: organismesCount } = useFetchOrganismesCount(filters);

  const exportFilename = `tdb-données-territoire-departement-${
    filters.departement?.code
  }-${new Date().toLocaleDateString()}.csv`;

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
          <RepartitionEffectifsParCfa
            repartitionEffectifsParCfa={effectifsParCfa}
            loading={isEffectifsParCfaLoading}
            error={effectifsParCfaError}
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

IndicateursAndRepartitionEffectifsDepartement.propTypes = {
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  ...indicateursEffectifsSchema,
};

export default IndicateursAndRepartitionEffectifsDepartement;
