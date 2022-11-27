import { InputController } from "../../../formEngine/components/Input/InputController";
import { Box, Flex, FormLabel, HStack } from "@chakra-ui/react";
import React, { memo } from "react";
import { employerSchema } from "./employerSchema";
import CheckEmptyFields from "../../../formEngine/components/CheckEmptyFields";

// eslint-disable-next-line react/display-name
export const CerfaEmployer = memo(() => {
  return (
    <Box>
      <InputController name="employeur.siret" fieldType="text" ismb="10" />
      <Flex>
        <Box w="55%" flex="1">
          <InputController name="employeur.denomination" />
          <FormLabel fontWeight={700} my={3}>
            Adresse de l&apos;établissement d&apos;exécution du contrat :
          </FormLabel>
          <HStack mb={3}>
            <InputController mb={0} name="employeur.adresse.numero" fieldType="number" />
            <InputController name="employeur.adresse.repetitionVoie" />
          </HStack>
          <InputController name="employeur.adresse.voie" fieldType="text" />
          <InputController name="employeur.adresse.complement" />
          <InputController name="employeur.adresse.codePostal" />
          <InputController name="employeur.adresse.commune" />
          <InputController name="employeur.adresse.departement" />
          <InputController name="employeur.adresse.region" />
          <InputController name="employeur.telephone" />
          <InputController name="employeur.courriel" />
        </Box>
        <Box w="45%" ml="5w">
          <InputController name="employeur.typeEmployeur" fieldType="select" />
          <InputController name="employeur.employeurSpecifique" fieldType="select" />
          <InputController name="employeur.naf" fieldType="text" />
          <InputController name="employeur.nombreDeSalaries" fieldType="number" />
          <InputController name="employeur.codeIdcc" fieldType="text" />
          <InputController name="employeur.codeIdcc_special" fieldType="radio" />
          <InputController name="employeur.libelleIdcc" fieldType="text" />
          <InputController name="employeur.regimeSpecifique" fieldType="radio" />
        </Box>
      </Flex>
      <CheckEmptyFields schema={employerSchema} blocName="employeur" />
    </Box>
  );
});
