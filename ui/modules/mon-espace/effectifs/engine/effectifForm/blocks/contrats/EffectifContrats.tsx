import { Box, Center, Flex, FormLabel, HStack, Text } from "@chakra-ui/react";
import React, { memo } from "react";

import { InputController } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/InputController";

// eslint-disable-next-line react/display-name, no-unused-vars
export const ApprenantContrats = memo(({ contrats }: { contrats: any[] }) => {
  return contrats && contrats.length > 0 ? (
    <>
      {contrats?.map((contrat, i) => {
        return (
          <Box key={i} borderBottomWidth="1px" borderColor="grey.700">
            <HStack spacing={2} alignItems="flex-end" mb={3}>
              <InputController name={`contrats[${i}].date_debut`} mb={0} w="33%" />
              <InputController name={`contrats[${i}].date_fin`} mb={0} w="33%" />
              <InputController name={`contrats[${i}].date_rupture`} mb={0} w="33%" />
            </HStack>

            <InputController name={`contrats[${i}].siret`} fieldType="text" ismb="10" />
            <Flex>
              <Box w="55%" flex="1">
                <InputController name={`contrats[${i}].denomination`} />
                <FormLabel fontWeight={700} my={3}>
                  Adresse de l&apos;employeur :
                </FormLabel>
                <HStack mb={3}>
                  <InputController mb={0} name={`contrats[${i}].adresse.numero`} fieldType="number" />
                  <InputController name={`contrats[${i}].adresse.repetition_voie`} />
                </HStack>
                <InputController name={`contrats[${i}].adresse.voie`} fieldType="text" />
                <InputController name={`contrats[${i}].adresse.complement`} />
                <InputController name={`contrats[${i}].adresse.code_postal`} />
                <InputController name={`contrats[${i}].adresse.commune`} />
                <InputController name={`contrats[${i}].adresse.departement`} />
                <InputController name={`contrats[${i}].adresse.region`} />
              </Box>
              <Box w="45%" ml="5w">
                <InputController name={`contrats[${i}].naf`} fieldType="text" />
                <InputController name={`contrats[${i}].nombre_de_salaries`} fieldType="number" />
                <InputController name={`contrats[${i}].type_employeur`} fieldType="select" />
              </Box>
            </Flex>
          </Box>
        );
      })}
    </>
  ) : (
    <Center>
      <Text>Pas de contrats</Text>
    </Center>
  );
});
