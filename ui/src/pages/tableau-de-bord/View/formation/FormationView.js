import { Divider, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { effectifsPropType, filtersPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import InfosFormationSection from "./infos-formation/InfosFormationSection";

const FormationView = ({ formationCfd, effectifs }) => {
  return (
    <Stack spacing="4w">
      <InfosFormationSection formationCfd={formationCfd} />
      <Divider orientation="horizontal" />

      {effectifs && <EffectifsSection effectifs={effectifs} />}
    </Stack>
  );
};

FormationView.propTypes = {
  effectifs: effectifsPropType,
  formationCfd: PropTypes.string.isRequired,
  filters: filtersPropType.isRequired,
};

export default FormationView;
