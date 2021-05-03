import PropTypes from "prop-types";
import React from "react";

import { PageSectionTitle } from "../../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../../common/components/tables/RepartitionEffectifsParCfa";
import { filtersPropType } from "../../../propTypes";
import withRepartitionFormationParCfa from "./withRepartitionFormationParCfaData";

const RepartitionEffectifsFormationParCfa = withRepartitionFormationParCfa(RepartitionEffectifsParCfa);

const RepartitionFormationParCfa = ({ formationCfd, filters }) => {
  return (
    <>
      <PageSectionTitle>Répartition des effectifs par centres de formation</PageSectionTitle>
      <RepartitionEffectifsFormationParCfa formationCfd={formationCfd} filters={filters} />
    </>
  );
};

RepartitionFormationParCfa.propTypes = {
  formationCfd: PropTypes.string.isRequired,
  filters: filtersPropType,
};

export default RepartitionFormationParCfa;
