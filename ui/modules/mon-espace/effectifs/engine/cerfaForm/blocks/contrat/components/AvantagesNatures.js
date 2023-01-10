import { Box, Flex, FormLabel, Text } from "@chakra-ui/react";
import React from "react";
import { InputController } from "../../../../formEngine/components/Input/InputController";
import { CollapseController } from "../../../../formEngine/components/CollapseController";
import { shouldAskAvantageNature } from "../domain/shouldAskAvantageNature";
import { useRecoilValue } from "recoil";
import { cerfaStatusGetter } from "../../../../formEngine/atoms";

export const AvantagesNatures = () => {
  const cerfaStatus = useRecoilValue(cerfaStatusGetter);
  const missingFieldAvantages = cerfaStatus.global.errors.avantageNature?.touched;
  return (
    <Box mt={6}>
      <InputController name="contrat.avantageNature" type="radio" />

      <CollapseController show={shouldAskAvantageNature}>
        <FormLabel mt={0} mb={4} fontWeight={700} id={`avantageNature_bloc_section-label`}>
          Avantages en nature, le cas échéant :
        </FormLabel>
        {missingFieldAvantages && (
          <Text color="flaterror">
            Si l&apos;apprenti(e) bénéficie d&apos;avantages en nature, veuillez saisir au moins un des champs
            ci-dessous.
          </Text>
        )}
        <Box
          borderWidth={missingFieldAvantages ? "1px" : "none"}
          borderColor="flaterror"
          padding={missingFieldAvantages ? "2" : "0"}
        >
          <Flex>
            <Box flex="1">
              <InputController name="contrat.avantageNourriture" type="number" />
            </Box>
            <Box ml={5}>
              <InputController name="contrat.avantageLogement" type="number" />
            </Box>
          </Flex>
          <Box>
            <InputController name="contrat.autreAvantageEnNature" type="consent" />
          </Box>
        </Box>
      </CollapseController>
    </Box>
  );
};
