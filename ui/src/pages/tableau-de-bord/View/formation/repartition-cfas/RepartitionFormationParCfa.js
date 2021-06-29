import PropTypes from "prop-types";
import React from "react";

import { PageSectionTitle } from "../../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../../common/components/tables/RepartitionEffectifsParCfa";
import { filtersPropTypes } from "../../../FiltersContext";
import withRepartitionFormationParCfa from "./withRepartitionFormationParCfaData";

const RepartitionEffectifsFormationParCfa = withRepartitionFormationParCfa(RepartitionEffectifsParCfa);

const RepartitionFormationParCfa = ({ formationCfd, filters }) => {
  return (
    <>
      <PageSectionTitle>Répartition des effectifs par organismes de formation</PageSectionTitle>
      <RepartitionEffectifsFormationParCfa formationCfd={formationCfd} filters={filters} />
    </>
  );
};

RepartitionFormationParCfa.propTypes = {
  formationCfd: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default RepartitionFormationParCfa;
