import { Heading } from "@chakra-ui/react";
import React from "react";

import { Section } from "../../../../../common/components";
import RepartitionEffectifsParFormation from "../../../../../common/components/tables/RepartitionEffectifsParFormation";
import { filtersPropTypes } from "../../../FiltersContext";
import withRepartitionNiveauFormationInCfa from "./withRepartitionNiveauFormationInCfa";

const RepartitionEffectifsCfaParFormation = withRepartitionNiveauFormationInCfa(RepartitionEffectifsParFormation);

const RepartionCfaNiveauAnneesSection = ({ filters }) => {
  return (
    <Section paddingY="4w">
      <Heading as="h3" textStyle="h3" marginBottom="2w">
        Répartition des effectifs par formations
      </Heading>
      <RepartitionEffectifsCfaParFormation filters={filters} />
    </Section>
  );
};

RepartionCfaNiveauAnneesSection.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartionCfaNiveauAnneesSection;
