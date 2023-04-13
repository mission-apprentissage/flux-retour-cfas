import React, { memo } from "react";
import { Box, Button, Flex, FormLabel, HStack } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import { InputController } from "../../../formEngine/components/Input/InputController";
import { fieldSelector } from "../../../formEngine/atoms";
import { useCerfaController } from "../../../formEngine/CerfaControllerContext";

// eslint-disable-next-line react/display-name, no-unused-vars
export const ApprenantContrats = memo(({ contrats, modeSifa = false }) => {
  const nouveaContratField = useRecoilValue(fieldSelector("apprenant.nouveau_contrat"));
  const cerfaController = useCerfaController();
  return (
    <>
      {contrats?.map((contrat, i) => {
        return (
          <Box key={i} borderBottomWidth="1px" borderColor="grey.700">
            <HStack spacing={2} alignItems="flex-end" mb={3}>
              <InputController name={`apprenant.contrats[${i}].date_debut`} mb={0} w="33%" />
              <InputController name={`apprenant.contrats[${i}].date_fin`} mb={0} w="33%" />
              <InputController name={`apprenant.contrats[${i}].date_rupture`} mb={0} w="33%" />
            </HStack>

            <InputController name={`apprenant.contrats[${i}].siret`} fieldType="text" ismb="10" />
            <Flex>
              <Box w="55%" flex="1">
                <InputController name={`apprenant.contrats[${i}].denomination`} />
                <FormLabel fontWeight={700} my={3}>
                  Adresse de l&apos;employeur :
                </FormLabel>
                <HStack mb={3}>
                  <InputController mb={0} name={`apprenant.contrats[${i}].adresse.numero`} fieldType="number" />
                  <InputController name={`apprenant.contrats[${i}].adresse.repetition_voie`} />
                </HStack>
                <InputController name={`apprenant.contrats[${i}].adresse.voie`} fieldType="text" />
                <InputController name={`apprenant.contrats[${i}].adresse.complement`} />
                <InputController name={`apprenant.contrats[${i}].adresse.code_postal`} />
                <InputController name={`apprenant.contrats[${i}].adresse.commune`} />
                <InputController name={`apprenant.contrats[${i}].adresse.departement`} />
                <InputController name={`apprenant.contrats[${i}].adresse.region`} />
              </Box>
              <Box w="45%" ml="5w">
                <InputController name={`apprenant.contrats[${i}].naf`} fieldType="text" />
                <InputController name={`apprenant.contrats[${i}].nombre_de_salaries`} fieldType="number" />
                <InputController name={`apprenant.contrats[${i}].type_employeur`} fieldType="select" />
                {i === 0 && nouveaContratField && (
                  <Button
                    size="lg"
                    onClick={async () => {
                      cerfaController.setField("apprenant.nouveau_contrat", "trigger", {
                        triggerSave: false,
                      });
                    }}
                    variant="primary"
                    mt={4}
                  >
                    + Ajouter le nouveau contrat
                  </Button>
                )}
              </Box>
            </Flex>
          </Box>
        );
      })}
    </>
  );
});
