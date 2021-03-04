import { HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import EffectifCard from "../../../common/components/EffectifCard/EffectifCard";
import PageSectionTitle from "../../../common/components/Page/PageSectionTitle";
import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../../common/constants/statutsColors";
import DefinitionIndicesModal from "./DefinitionIndicesModal";

const EffectifsSection = ({ effectifs }) => {
  return (
    <>
      <PageSectionTitle>Effectifs</PageSectionTitle>
      <DefinitionIndicesModal />
      <HStack marginTop="4w">
        <EffectifCard
          count={effectifs.apprentis.count}
          evolution={effectifs.apprentis.evolution}
          label="apprentis"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.apprentis}
        />
        <EffectifCard
          count={effectifs.inscrits.count}
          evolution={effectifs.inscrits.evolution}
          label="inscrits"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.inscrits}
        />
        <EffectifCard
          count={effectifs.abandons.count}
          evolution={effectifs.abandons.evolution}
          label="abandons"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.abandons}
        />
      </HStack>
    </>
  );
};

EffectifsSection.propTypes = {
  effectifs: PropTypes.shape({
    apprentis: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
    inscrits: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
    abandons: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
  }).isRequired,
};

export default EffectifsSection;
