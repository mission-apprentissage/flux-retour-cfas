import { HStack } from "@chakra-ui/react";
import React from "react";

import EffectifCard from "../../../common/components/EffectifCard/EffectifCard";
import PageSectionTitle from "../../../common/components/Page/PageSectionTitle";
import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../../common/constants/statutsColors";
import DefinitionIndicesModal from "./DefinitionIndicesModal";

const EffectifsSection = () => {
  return (
    <>
      <PageSectionTitle>Effectifs</PageSectionTitle>
      <DefinitionIndicesModal />
      <HStack marginTop="4w">
        <EffectifCard stat={7381} label="apprentis" indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.apprentis} />
        <EffectifCard stat={5563} label="inscrits" indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.inscrits} />
        <EffectifCard stat={83} label="abandons" indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.abandons} />
        <EffectifCard
          stat={24320}
          label="prospects multiples"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.prospects}
        />
        <EffectifCard
          stat={16483}
          label="prospects uniques"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.prospects}
        />
      </HStack>
    </>
  );
};

export default EffectifsSection;
