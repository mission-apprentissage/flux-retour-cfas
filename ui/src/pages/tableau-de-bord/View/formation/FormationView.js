import { Divider, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
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
  filters: filtersPropTypes.state,
};

export default FormationView;
