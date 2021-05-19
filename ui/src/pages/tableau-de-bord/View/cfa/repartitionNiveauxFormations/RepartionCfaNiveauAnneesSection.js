import React from "react";

import { PageSectionSubtitle } from "../../../../../common/components";
import RepartitionEffectifsParNiveauEtAnneeFormation from "../../../../../common/components/tables/RepartitionEffectifsParNiveauEtAnneeFormation";
import { filtersPropType } from "../../../propTypes";
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
  filters: filtersPropType.isRequired,
};
export default RepartionCfaNiveauAnneesSection;
