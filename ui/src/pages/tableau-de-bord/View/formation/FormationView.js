import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../FiltersContext";
import IndicesProvenanceSection from "../../IndicesProvenanceSection";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import InfosFormationSection from "./infos-formation/InfosFormationSection";
import RepartitionFormationParCfa from "./repartition-cfas/RepartitionFormationParCfa";

const FormationView = ({ formationCfd, filters, effectifs, loading }) => {
  return (
    <>
      <InfosFormationSection formationCfd={formationCfd} />
      <IndicesProvenanceSection />
      {effectifs && <EffectifsSection effectifs={effectifs} loading={loading} />}
      <RepartitionFormationParCfa formationCfd={formationCfd} filters={filters} />
    </>
  );
};

FormationView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  formationCfd: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default FormationView;
