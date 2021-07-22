import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import CfaSection from "./infoCfa/CfaSection";
import RepartionCfaNiveauAnneesSection from "./repartitionNiveauxFormations/RepartionCfaNiveauAnneesSection";

const CfaView = ({ cfaUai, filters, effectifs, loading }) => {
  return (
    <>
      <CfaSection filters={filters} cfaUai={cfaUai} />
      {effectifs && <EffectifsSection effectifs={effectifs} loading={loading} />}
      <RepartionCfaNiveauAnneesSection filters={filters} />
    </>
  );
};

CfaView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  cfaUai: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default CfaView;
