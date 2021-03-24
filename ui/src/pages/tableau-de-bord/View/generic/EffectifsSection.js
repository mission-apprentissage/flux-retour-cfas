import { HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import EffectifCard from "../../../../common/components/EffectifCard/EffectifCard";
import PageSectionTitle from "../../../../common/components/Page/PageSectionTitle";
import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../../../common/constants/statutsColors";
import DefinitionIndicesModal from "./DefinitionIndicesModal";

const EffectifsSection = ({ effectifs }) => {
  return (
    <div>
      <PageSectionTitle>Effectifs</PageSectionTitle>
      <DefinitionIndicesModal />
      <HStack marginTop="4w">
        <EffectifCard
          count={effectifs.apprentis.count}
          label="apprentis"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.apprentis}
        />
        <EffectifCard
          count={effectifs.inscrits.count}
          label="inscrits"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.inscrits}
        />
        <EffectifCard
          count={effectifs.abandons.count}
          label="abandons"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.abandons}
        />
      </HStack>
    </div>
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
