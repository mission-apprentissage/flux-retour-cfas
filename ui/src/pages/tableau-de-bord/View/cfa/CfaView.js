import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import DataFeedbackSection from "./data-feedback/DataFeedbackSection";
import InfoCfaSection from "./infoCfa/InfoCfaSection";
import RepartionCfaNiveauAnneesSection from "./repartitionNiveauxFormations/RepartionCfaNiveauAnneesSection";

const CfaView = ({ cfaSiret, filters, effectifs, loading }) => {
  return (
    <>
      <InfoCfaSection cfaSiret={cfaSiret} />
      <DataFeedbackSection siret={cfaSiret} />
      {effectifs && <EffectifsSection effectifs={effectifs} loading={loading} />}
      <RepartionCfaNiveauAnneesSection filters={filters} />
    </>
  );
};

CfaView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  cfaSiret: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default CfaView;
