import { Divider, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { PageSectionTitle } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import RepartitionEffectifsReseau from "./repartition/RepartitionEffectifsReseau";

const ReseauView = ({ reseau, effectifs, filters }) => {
  return (
    <Stack spacing="4w">
      <PageSectionTitle>Réseau {reseau}</PageSectionTitle>
      <Divider orientation="horizontal" />
      {effectifs && <EffectifsSection effectifs={effectifs} />}
      <RepartitionEffectifsReseau filters={filters} />
    </Stack>
  );
};

ReseauView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropTypes.state,
  reseau: PropTypes.string.isRequired,
};

export default ReseauView;
