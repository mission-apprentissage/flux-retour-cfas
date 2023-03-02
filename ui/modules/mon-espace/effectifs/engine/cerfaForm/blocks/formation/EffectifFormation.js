import React, { memo } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { InputController } from "../../../formEngine/components/Input/InputController";

// eslint-disable-next-line react/display-name, @typescript-eslint/no-unused-vars
export const EffectifFormation = memo(() => {
  return (
    <Box my={9}>
      <HStack spacing={2} alignItems="flex-end">
        <InputController name="formation.date_debut_formation" w="33%" mb={0} />
        <InputController name="formation.date_fin_formation" w="33%" mb={0} />
        <InputController name="formation.date_obtention_diplome" w="33%" mb={0} />
        <InputController name="formation.duree_formation_relle" w="33%" mb={0} />
      </HStack>
    </Box>
  );
});
