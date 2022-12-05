import { InputController } from "../../../formEngine/components/Input/InputController";
import { Box, Flex, FormLabel, HStack, Text } from "@chakra-ui/react";
import React, { memo } from "react";
import { CollapseController } from "../../../formEngine/components/CollapseController";
import { shouldAskRepresentantLegal } from "./domain/shouldAskRepresentantLegal";
import { shouldAskResponsalLegalAdresse } from "./domain/shouldAskResponsalLegalAdresse";
import CheckEmptyFields from "../../../formEngine/components/CheckEmptyFields";
import { apprentiSchema } from "./apprentiSchema";

// eslint-disable-next-line react/display-name
export const CerfaApprenti = memo(() => {
  return (
    <Box>
      <Flex>
        <Box w="55%" flex="1">
          <InputController name="apprenti.nom" />
          <InputController name="apprenti.prenom" />
          <FormLabel fontWeight="bold" my={3}>
            Adresse de l&apos;apprenti(e) :
          </FormLabel>
          <HStack mb={3}>
            <InputController mb={0} name="apprenti.adresse.numero" />
            <InputController name="apprenti.adresse.repetitionVoie" />
          </HStack>
          <InputController name="apprenti.adresse.voie" />
          <InputController name="apprenti.adresse.complement" />
          <InputController name="apprenti.adresse.codePostal" />
          <InputController name="apprenti.adresse.commune" />
          <InputController name="apprenti.adresse.pays" />
          <InputController name="apprenti.telephone" />
          <InputController name="apprenti.courriel" />
          <Box mt={5}>
            <InputController name="apprenti.apprentiMineur" />
            <InputController name="apprenti.apprentiMineurNonEmancipe" fieldType="radio" />
          </Box>
          <Box mt={5}>
            <CollapseController show={shouldAskRepresentantLegal}>
              <Text fontWeight="bold" my={3} mt={0}>
                Représentant légal
              </Text>
              <InputController name="apprenti.responsableLegal.nom" />
              <InputController name="apprenti.responsableLegal.prenom" />
              <Text fontWeight="bold" my={3}>
                Adresse du représentant légal :
              </Text>
              <InputController name="apprenti.responsableLegal.memeAdresse" fieldType="radio" />
              <CollapseController show={shouldAskResponsalLegalAdresse}>
                <InputController name="apprenti.responsableLegal.adresse.numero" />
                <HStack mb={3}>
                  <InputController mb={0} name="apprenti.responsableLegal.adresse.numero" />
                  <InputController name="apprenti.responsableLegal.adresse.repetitionVoie" />
                </HStack>
                <InputController name="apprenti.responsableLegal.adresse.voie" />
                <InputController name="apprenti.responsableLegal.adresse.complement" />
                <InputController name="apprenti.responsableLegal.adresse.codePostal" />
                <InputController name="apprenti.responsableLegal.adresse.commune" />
                <InputController name="apprenti.responsableLegal.adresse.pays" />
              </CollapseController>
            </CollapseController>
          </Box>
        </Box>
        <Box w="45%" ml="5w">
          <InputController name="apprenti.dateNaissance" />
          <InputController name="apprenti.sexe" />
          <InputController name="apprenti.departementNaissance" />
          <InputController name="apprenti.communeNaissance" />
          <InputController name="apprenti.nationalite" />
          <InputController name="apprenti.regimeSocial" />
          <InputController name="apprenti.inscriptionSportifDeHautNiveau" />
          <InputController name="apprenti.handicap" />
          <InputController name="apprenti.situationAvantContrat" />
          <InputController name="apprenti.diplomePrepare" />
          <InputController name="apprenti.derniereClasse" />
          <InputController name="apprenti.intituleDiplomePrepare" />
          <InputController name="apprenti.diplome" />
        </Box>
      </Flex>
      <CheckEmptyFields schema={apprentiSchema} blocName="apprenti" />
    </Box>
  );
});
