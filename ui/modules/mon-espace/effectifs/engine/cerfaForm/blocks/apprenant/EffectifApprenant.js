import React, { memo } from "react";
import { Box, Flex, FormLabel, HStack, Text } from "@chakra-ui/react";
import { InputController } from "../../../formEngine/components/Input/InputController";
import { CollapseController } from "../../../formEngine/components/CollapseController";
import { shouldAskRepresentantLegal } from "./domain/shouldAskRepresentantLegal";
import { shouldAskResponsalLegalAdresse } from "./domain/shouldAskResponsalLegalAdresse";
import { ApprenantStatuts } from "./components/ApprenantStatuts";
import { ApprenantContrats } from "./components/ApprenantContrats";
import { useRecoilValue } from "recoil";
import { valuesSelector } from "../../../formEngine/atoms";

// eslint-disable-next-line react/display-name
export const EffectifApprenant = memo(({ modeSifa = false }) => {
  const values = useRecoilValue(valuesSelector);
  return (
    <Box>
      <Box my={9} borderWidth="1px" borderColor="bluefrance">
        <ApprenantStatuts modeSifa={modeSifa} />
      </Box>
      <Flex borderWidth="1px" borderColor="bluefrance">
        <Box w="55%" flex="1">
          <InputController name="apprenant.ine" />
          <InputController name="apprenant.sexe" />
          <InputController name="apprenant.nom" />
          <InputController name="apprenant.prenom" />
          <InputController name="apprenant.date_de_naissance" />
          <InputController name="apprenant.code_postal_de_naissance" />
          <InputController name="apprenant.nationalite" />
          <InputController name="apprenant.handicap" />
          <InputController name="apprenant.inscription_sportif_haut_niveau" />
          <InputController name="apprenant.courriel" />
          <InputController name="apprenant.telephone" />
          <Box mt={5}>
            <InputController name="apprenant.mineur_emancipe" />
          </Box>
          <Box mt={5}>
            <CollapseController show={shouldAskRepresentantLegal}>
              <Text fontWeight="bold" my={3} mt={0}>
                Représentant légal
              </Text>
              <InputController name="apprenant.representant_legal.nom" />
              <InputController name="apprenant.representant_legal.prenom" />
              <InputController name="apprenant.representant_legal.courriel" />
              <InputController name="apprenant.representant_legal.telephone" />
              <Text fontWeight="bold" my={3}>
                Adresse du représentant légal :
              </Text>
              <InputController name="apprenant.representant_legal.meme_adresse" fieldType="radio" />
              <CollapseController show={shouldAskResponsalLegalAdresse}>
                <HStack mb={3}>
                  <InputController mb={0} name="apprenant.representant_legal.adresse.numero" />
                  <InputController name="apprenant.representant_legal.adresse.repetition_voie" />
                </HStack>
                <InputController name="apprenant.representant_legal.adresse.voie" />
                <InputController name="apprenant.representant_legal.adresse.complement" />
                <InputController name="apprenant.representant_legal.adresse.code_postal" />
                <InputController name="apprenant.representant_legal.adresse.commune" />
              </CollapseController>
            </CollapseController>
          </Box>
        </Box>
        <Box w="45%" ml="5w">
          <FormLabel fontWeight="bold" my={3}>
            Adresse de l&apos;apprenant(e) :
          </FormLabel>
          <Flex fontStyle="italic" fontSize="0.9rem" borderWidth="1px" borderColor="dgalt" alignItems="center" mb={4}>
            {values.apprenant.adresse?.complete && (
              <Box fontWeight="bold">Infomation ERP/API: {values.apprenant.adresse.complete}</Box>
            )}
            {!values.apprenant.adresse?.complete && (
              <HStack>
                <Text>
                  {values.apprenant.adresse.numero} {values.apprenant.adresse.repetition_voie}{" "}
                  {values.apprenant.adresse.voie}
                </Text>
                <Text>{values.apprenant.adresse.complement}</Text>
                <Text>
                  {values.apprenant.adresse.code_postal} {values.apprenant.adresse.commune}
                </Text>
              </HStack>
            )}
          </Flex>
          <HStack mb={3}>
            <InputController mb={0} name="apprenant.adresse.numero" />
            <InputController name="apprenant.adresse.repetition_voie" />
          </HStack>
          <InputController name="apprenant.adresse.voie" />
          <InputController name="apprenant.adresse.complement" />
          <InputController name="apprenant.adresse.code_postal" />
          <InputController name="apprenant.adresse.code_insee" />
          <InputController name="apprenant.adresse.commune" />
          <InputController name="apprenant.situation_avant_contrat" />
          <InputController name="apprenant.dernier_organisme_uai" />
          <InputController name="apprenant.derniere_situation" />
          <InputController name="apprenant.dernier_diplome" />
          <InputController name="apprenant.regime_scolaire" />
        </Box>
      </Flex>
      <Box my={9} borderWidth="1px" borderColor="bluefrance">
        <HStack spacing={2} alignItems="flex-end">
          <InputController name="formation.date_debut_formation" w="33%" mb={0} />
          <InputController name="formation.date_fin_formation" w="33%" mb={0} />
          <InputController name="formation.date_obtention_diplome" w="33%" mb={0} />
          <InputController name="formation.duree_formation_relle" w="33%" mb={0} />
        </HStack>
      </Box>
      <Box my={9} borderWidth="1px" borderColor="bluefrance">
        <ApprenantContrats modeSifa={modeSifa} />
      </Box>
    </Box>
  );
});
