import { Divider, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { effectifsPropType, filtersPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import InfosFormationSection from "./infos-formation/InfosFormationSection";
import RepartitionFormationParCfa from "./repartition-cfas/RepartitionFormationParCfa";

const FormationView = ({ formationCfd, filters, effectifs }) => {
  return (
    <Stack spacing="4w">
      <InfosFormationSection formationCfd={formationCfd} />
      <Divider orientation="horizontal" />
      {effectifs && <EffectifsSection effectifs={effectifs} />}
      <Divider orientation="horizontal" />
      <RepartitionFormationParCfa formationCfd={formationCfd} filters={filters} />
    </Stack>
  );
};

FormationView.propTypes = {
  effectifs: effectifsPropType,
  formationCfd: PropTypes.string.isRequired,
  filters: filtersPropType.isRequired,
};

export default FormationView;
