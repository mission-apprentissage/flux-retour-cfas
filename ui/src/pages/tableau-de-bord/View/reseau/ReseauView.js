import { Divider, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { PageSectionTitle } from "../../../../common/components";
import { effectifsPropType, filtersPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import RepartitionEffectifsReseau from "./repartition/RepartitionEffectifsReseau";

const ReseauView = ({ reseau, filters, effectifs }) => {
  return (
    <Stack spacing="4w">
      <PageSectionTitle>Réseau {reseau}</PageSectionTitle>
      <Divider orientation="horizontal" />
      {effectifs && <EffectifsSection effectifs={effectifs} />}
      <RepartitionEffectifsReseau reseau={reseau} filters={filters} />
    </Stack>
  );
};

ReseauView.propTypes = {
  effectifs: effectifsPropType,
  reseau: PropTypes.string.isRequired,
  filters: filtersPropType.isRequired,
};

export default ReseauView;
