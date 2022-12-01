import { Box, Flex, FormLabel } from "@chakra-ui/react";
import React, { memo } from "react";
import { InputController } from "../../../formEngine/components/Input/InputController";

// eslint-disable-next-line react/display-name
export const CerfaMaitre = memo(() => {
  return (
    <Box>
      <Flex>
        <Box w="55%" flex="1">
          <FormLabel fontWeight={700}>Maître d&apos;apprentissage n°1 </FormLabel>
          <InputController name={"maitre1.nom"} />
          <InputController name={"maitre1.prenom"} />
          <InputController name={"maitre1.dateNaissance"} />
        </Box>
        <Box w="55%" flex="1" ml={5}>
          <FormLabel fontWeight={700}>Maître d&apos;apprentissage n°2 (Optionnel)</FormLabel>
          <InputController name={"maitre2.nom"} />
          <InputController name={"maitre2.prenom"} />
          <InputController name={"maitre2.dateNaissance"} />
        </Box>
      </Flex>
      <InputController name={"employeur.attestationEligibilite"} />
    </Box>
  );
});
