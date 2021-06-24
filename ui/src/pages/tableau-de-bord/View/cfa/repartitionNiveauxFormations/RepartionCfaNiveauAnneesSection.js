import React from "react";

import { PageSectionSubtitle } from "../../../../../common/components";
import RepartitionEffectifsParNiveauEtAnneeFormation from "../../../../../common/components/tables/RepartitionEffectifsParNiveauEtAnneeFormation";
import { filtersPropTypes } from "../../../FiltersContext";
import withRepartitionNiveauFormationInCfa from "./withRepartitionNiveauFormationInCfa";

const RepartitionEffectifsCfaParNiveauEtAnneeFormation = withRepartitionNiveauFormationInCfa(
  RepartitionEffectifsParNiveauEtAnneeFormation
);

const RepartionCfaNiveauAnneesSection = ({ filters }) => {
  return (
    <section>
      <PageSectionSubtitle>Répartition par niveaux et années de formation</PageSectionSubtitle>
      <RepartitionEffectifsCfaParNiveauEtAnneeFormation filters={filters} />
    </section>
  );
};

RepartionCfaNiveauAnneesSection.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartionCfaNiveauAnneesSection;
