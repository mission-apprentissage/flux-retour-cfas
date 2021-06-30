import { Heading } from "@chakra-ui/react";
import React from "react";

import { Section } from "../../../../../common/components";
import RepartitionEffectifsParNiveauEtAnneeFormation from "../../../../../common/components/tables/RepartitionEffectifsParNiveauEtAnneeFormation";
import { filtersPropTypes } from "../../../FiltersContext";
import withRepartitionNiveauFormationInCfa from "./withRepartitionNiveauFormationInCfa";

const RepartitionEffectifsCfaParNiveauEtAnneeFormation = withRepartitionNiveauFormationInCfa(
  RepartitionEffectifsParNiveauEtAnneeFormation
);

const RepartionCfaNiveauAnneesSection = ({ filters }) => {
  return (
    <Section paddingY="4w">
      <Heading as="h3" textStyle="h3" marginBottom="2w">
        Répartition des effectifs par formations
      </Heading>
      <RepartitionEffectifsCfaParNiveauEtAnneeFormation filters={filters} />
    </Section>
  );
};

RepartionCfaNiveauAnneesSection.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartionCfaNiveauAnneesSection;
