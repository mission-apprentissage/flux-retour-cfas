import { Heading } from "@chakra-ui/react";
import { TabPanel } from "@chakra-ui/tabs";
import React from "react";

import { RepartitionEffectifsTabs, Section } from "../../../../common/components";
import RepartitionEffectifsParDepartement from "../../../../common/components/tables/RepartitionEffectifsParDepartement";
import RepartitionEffectifsParNiveauFormation from "../../../../common/components/tables/RepartitionEffectifsParNiveauFormation";
import useFetchEffectifsParDepartement from "../../../../common/hooks/useFetchEffectifsParDepartement";
import useFetchEffectifsParNiveauFormation from "../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import { filtersPropTypes } from "../FiltersContext";

const RepartitionEffectifsRegion = ({ filters }) => {
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

  return (
    <Section paddingY="4w">
      <Heading as="h3" variant="h3">
        Répartition des effectifs
      </Heading>
      <RepartitionEffectifsTabs>
        <TabPanel>
          <RepartitionEffectifsParDepartement
            effectifs={effectifsParDepartement}
            loading={isEffectifsParDepartementLoading}
            error={effectifsParDepartementError}
          />
        </TabPanel>
        <TabPanel>
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

RepartitionEffectifsRegion.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsRegion;
