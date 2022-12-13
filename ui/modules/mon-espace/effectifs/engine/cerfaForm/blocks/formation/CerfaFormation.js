import React, { memo } from "react";
import { Box, Flex, FormLabel, HStack, Text } from "@chakra-ui/react";
import { InputController } from "../../../formEngine/components/Input/InputController";
import { CollapseController } from "../../../formEngine/components/CollapseController";
import CheckEmptyFields from "../../../formEngine/components/CheckEmptyFields";
import { formationSchema } from "./formationSchema";
import { shouldAskEtablissementFormation } from "./domain/shouldAskEtablissementFormation";

// eslint-disable-next-line react/display-name
export const CerfaFormation = memo(() => {
  return (
    <>
      <Box>
        <InputController name="organismeFormation.formationInterne" type="radio" mt="2" mb={6} />
        <InputController name="organismeFormation.siret" mb="10" />

        <Flex>
          <Box w="55%" flex="1">
            <InputController name="organismeFormation.denomination" mt="2" />
            <InputController name="organismeFormation.uaiCfa" mt="2" />
            <FormLabel fontWeight={700} my={3}>
              Adresse du CFA responsable :{" "}
            </FormLabel>
            <HStack mb={3}>
              <InputController mb={0} name="organismeFormation.adresse.numero" />
              <InputController name="organismeFormation.adresse.repetitionVoie" />
            </HStack>
            <InputController name="organismeFormation.adresse.voie" mt="2" />
            <InputController name="organismeFormation.adresse.complement" mt="2" />
            <InputController name="organismeFormation.adresse.codePostal" mt="2" />
            <InputController name="organismeFormation.adresse.commune" mt="2" />
          </Box>
          <Box w="45%" flex="1" ml="5w">
            <InputController name="formation.rncp" mt="2" />
            <InputController name="formation.codeDiplome" mt="2" />
            <InputController name="formation.typeDiplome" type="select" mt="2" />
            <InputController name="formation.intituleQualification" mt="2" />
            <FormLabel fontWeight={700} my={3}>
              Organisation de la formation en CFA :
            </FormLabel>
            <InputController name="formation.dateDebutFormation" type="date" mt="2" />
            <InputController name="formation.dateFinFormation" type="date" mt="2" />
            <Flex mt={4}>
              <InputController name="formation.dureeFormation" type="number" mt="2" precision={0} min={1} />
            </Flex>
          </Box>
        </Flex>
      </Box>
      <Box>
        <Text fontWeight="bold" my={3}>
          Le lieu de formation :
        </Text>
        <InputController name="etablissementFormation.memeResponsable" type="radio" mt="2" />
        <CollapseController show={shouldAskEtablissementFormation}>
          <InputController name="etablissementFormation.siret" mb="2" />
          <Flex>
            <Box w="55%" flex="1">
              <InputController name="etablissementFormation.denomination" mt="2" />
              <InputController name="etablissementFormation.uaiCfa" mt="2" />
              <FormLabel fontWeight={700} my={3}>
                Adresse du lieu de formation :{" "}
              </FormLabel>
              <HStack mb={3}>
                <InputController mb={0} precision={0} name="etablissementFormation.adresse.numero" />
                <InputController name="etablissementFormation.adresse.repetitionVoie" />
              </HStack>
              <InputController name="etablissementFormation.adresse.voie" mt="2" />
              <InputController name="etablissementFormation.adresse.complement" mt="2" />
              <InputController name="etablissementFormation.adresse.codePostal" mt="2" />
              <InputController name="etablissementFormation.adresse.commune" mt="2" />
            </Box>
          </Flex>
        </CollapseController>
      </Box>
      <CheckEmptyFields schema={formationSchema} blocName="formation" />
    </>
  );
});
