import { Flex, Heading } from "@chakra-ui/react";
import { TabPanel } from "@chakra-ui/tabs";
import React from "react";

import {
  ExportRepartitionByFormationButton,
  ExportRepartitionByOrganismeButton,
  RepartitionEffectifsTabs,
  Section,
} from "../../../../common/components";
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
      <RepartitionEffectifsTabs>
        <TabPanel paddingTop="4w">
          <Flex justifyContent="space-between">
            <Heading as="h3" variant="h3" marginBottom="3w">
              Liste des organismes par département
            </Heading>
            <ExportRepartitionByOrganismeButton />
          </Flex>
          <RepartitionEffectifsParDepartement
            effectifs={effectifsParDepartement}
            loading={isEffectifsParDepartementLoading}
            error={effectifsParDepartementError}
          />
        </TabPanel>
        <TabPanel paddingTop="4w">
          <Flex justifyContent="space-between">
            <Heading as="h3" variant="h3" marginBottom="3w">
              Liste des niveaux de formation
            </Heading>
            <ExportRepartitionByFormationButton />
          </Flex>
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
