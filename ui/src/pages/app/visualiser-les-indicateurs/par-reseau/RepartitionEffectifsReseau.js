import { Flex, Heading } from "@chakra-ui/react";
import { TabPanel } from "@chakra-ui/tabs";
import React from "react";

import {
  ExportRepartitionByFormationButton,
  ExportRepartitionByOrganismeButton,
  RepartitionEffectifsTabs,
  Section,
} from "../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import RepartitionEffectifsParFormation from "../../../../common/components/tables/RepartitionEffectifsParFormation";
import useFetchEffectifsParCfa from "../../../../common/hooks/useFetchEffectifsParCfa";
import useFetchEffectifsParNiveauFormation from "../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import { filtersPropTypes } from "../FiltersContext";

const RepartitionEffectifsReseau = ({ filters }) => {
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

  return (
    <Section paddingY="4w">
      <RepartitionEffectifsTabs>
        <TabPanel paddingTop="4w">
          <Flex justifyContent="space-between">
            <Heading as="h3" variant="h3" marginBottom="3w">
              Liste des organismes de formation
            </Heading>
            <ExportRepartitionByOrganismeButton />
          </Flex>
          <RepartitionEffectifsParCfa
            repartitionEffectifsParCfa={effectifsParCfa}
            loading={isEffectifsParCfaLoading}
            error={effectifsParCfaError}
          />
        </TabPanel>
        <TabPanel paddingTop="4w">
          <Flex justifyContent="space-between">
            <Heading as="h3" variant="h3" marginBottom="3w">
              Liste des formations par niveau
            </Heading>
            <ExportRepartitionByFormationButton />
          </Flex>
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

RepartitionEffectifsReseau.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsReseau;
