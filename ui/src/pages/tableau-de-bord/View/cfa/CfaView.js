import { Divider, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import DataFeedbackSection from "./data-feedback/DataFeedbackSection";
import InfoCfaSection from "./infoCfa/InfoCfaSection";
import RepartionCfaNiveauAnneesSection from "./repartitionNiveauxFormations/RepartionCfaNiveauAnneesSection";

const CfaView = ({ cfaSiret, effectifs, filters }) => {
  return (
    <Stack spacing="4w">
      {/* Feedback CFA  */}
      <DataFeedbackSection siret={cfaSiret} />

      {/* Info CFA  */}
      <InfoCfaSection cfaSiret={cfaSiret} />
      <Divider orientation="horizontal" />

      {/* Effectifs du CFA  */}
      {effectifs && <EffectifsSection effectifs={effectifs} />}

      {/* Répartition des effectifs / formations du CFA  */}
      <RepartionCfaNiveauAnneesSection filters={filters} />
    </Stack>
  );
};

CfaView.propTypes = {
  effectifs: effectifsPropType,
  cfaSiret: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default CfaView;
