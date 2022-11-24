import React, { memo } from "react";
import { Box, Flex, FormLabel } from "@chakra-ui/react";
import { InputController } from "../../../formEngine/components/Input/InputController";
import { NumeroContratPrecedentField } from "./components/NumeroContratPrecedentField";
import { TypeDerogationField } from "./components/TypeDerogationField";
import { Remunerations } from "./components/Remunerations";
import { AvantagesNatures } from "./components/AvantagesNatures";
import CheckEmptyFields from "../../../formEngine/components/CheckEmptyFields";
import { CollapseController } from "../../../formEngine/components/CollapseController";
import { shouldAskDateEffetAvenant } from "./domain/shouldAskDateEffetAvenant";
import { contratSchema } from "./contratSchema";

// eslint-disable-next-line react/display-name
export const CerfaContrat = memo(() => {
  return (
    <Box>
      <Flex>
        <Box w="55%" flex="1">
          <InputController name="contrat.typeContratApp" />
          <TypeDerogationField />
          <NumeroContratPrecedentField />
        </Box>
        <Box w="55%" ml="5w">
          <InputController name="contrat.dateDebutContrat" />
          <CollapseController show={shouldAskDateEffetAvenant}>
            <InputController name="contrat.dateEffetAvenant" />
          </CollapseController>
          <InputController name="contrat.dateFinContrat" />
        </Box>
      </Flex>
      <Box pt={4}>
        <Box>
          <FormLabel fontWeight={700}>Durée hebdomadaire du travail :</FormLabel>
          <Flex w="55%">
            <InputController name="contrat.dureeTravailHebdoHeures" type="number" />
            <InputController ml="5" name="contrat.dureeTravailHebdoMinutes" type="number" />
          </Flex>
        </Box>
        <InputController name="contrat.travailRisque" />
        <Remunerations />
        <AvantagesNatures />
      </Box>
      <CheckEmptyFields schema={contratSchema} blocName="contrat" />
    </Box>
  );
});
