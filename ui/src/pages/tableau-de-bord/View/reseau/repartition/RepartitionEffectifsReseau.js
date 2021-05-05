import PropTypes from "prop-types";
import React from "react";

import { PageSectionTitle } from "../../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../../common/components/tables/RepartitionEffectifsParCfa";
import { filtersPropType } from "../../../propTypes";
import withRepartitionEffectifsReseauParCfa from "./withRepartitionEffectifsReseauParCfaData";

const RepartitionEffectifsReseauParCfa = withRepartitionEffectifsReseauParCfa(RepartitionEffectifsParCfa);

const RepartitionEffectifsReseau = ({ reseau, filters }) => {
  return (
    <>
      <PageSectionTitle>Répartition des effectifs par centres de formation</PageSectionTitle>
      <RepartitionEffectifsReseauParCfa reseau={reseau} filters={filters} />
    </>
  );
};

RepartitionEffectifsReseau.propTypes = {
  reseau: PropTypes.string.isRequired,
  filters: filtersPropType.isRequired,
};

export default RepartitionEffectifsReseau;
