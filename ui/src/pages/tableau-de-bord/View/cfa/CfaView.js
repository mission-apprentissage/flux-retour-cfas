import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import InfoCfaSection from "./infoCfa/InfoCfaSection";
import RepartionCfaNiveauAnneesSection from "./repartitionNiveauxFormations/RepartionCfaNiveauAnneesSection";

const CfaView = ({ cfaSiret, filters, effectifs }) => {
  return (
    <>
      {/* Info CFA  */}
      <InfoCfaSection cfaSiret={cfaSiret} />
      {/* <DataFeedbackSection siret={cfaSiret} /> */}

      {/* Effectifs du CFA  */}
      {effectifs && <EffectifsSection effectifs={effectifs} />}

      {/* Répartition des effectifs / formations du CFA  */}
      <RepartionCfaNiveauAnneesSection filters={filters} />
    </>
  );
};

CfaView.propTypes = {
  effectifs: effectifsPropType,
  cfaSiret: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default CfaView;
