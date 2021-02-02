import { HStack } from "@chakra-ui/react";
import React from "react";

import EffectifCard from "../../../common/components/EffectifCard/EffectifCard";
import PageSectionTitle from "../../../common/components/Page/PageSectionTitle";

const EffectifsSection = () => {
  return (
    <>
      <PageSectionTitle>Effectifs</PageSectionTitle>
      <HStack marginTop="4w">
        <EffectifCard stat={7381} label="apprentis" indicatorColor="orangesoft.500" />
        <EffectifCard stat={5563} label="inscrits" indicatorColor="pinklight.500" />
        <EffectifCard stat={83} label="abandons" indicatorColor="bluedark.500" />
        <EffectifCard stat={24320} label="prospects multiples" indicatorColor="bluesoft.500" />
        <EffectifCard stat={16483} label="prospects uniques" indicatorColor="bluesoft.500" />
      </HStack>
    </>
  );
};

export default EffectifsSection;
