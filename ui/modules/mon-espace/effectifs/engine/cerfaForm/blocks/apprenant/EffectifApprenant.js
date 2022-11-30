import React, { memo, useCallback, useState } from "react";
import { Box, Button, Flex, FormLabel, HStack, Text } from "@chakra-ui/react";
import { InputController } from "../../../formEngine/components/Input/InputController";
import { CollapseController } from "../../../formEngine/components/CollapseController";
import { shouldAskRepresentantLegal } from "./domain/shouldAskRepresentantLegal";
import { shouldAskResponsalLegalAdresse } from "./domain/shouldAskResponsalLegalAdresse";
import { fieldSelector, valuesSelector } from "../../../formEngine/atoms";
import { useRecoilValue } from "recoil";
import { Input } from "../../../formEngine/components/Input/Input";
import { useCerfaController } from "../../../formEngine/CerfaControllerContext";
import { apiService } from "../../../services/api.service";
import { effectifIdAtom } from "../../../atoms";
import { organismeAtom } from "../../../../../../../hooks/organismeAtoms";

// eslint-disable-next-line react/display-name
export const EffectifApprenant = memo(() => {
  const values = useRecoilValue(valuesSelector);
  const nouveauStatutValeurField = useRecoilValue(fieldSelector("apprenant.nouveau_statut.valeur_statut"));
  const nouveauStatutDateField = useRecoilValue(fieldSelector("apprenant.nouveau_statut.date_statut"));
  const [nouveauStatutValeur, setNouveauStatutValeur] = useState({ value: "", hasError: false });
  const [nouveauStatutDate, setNouveauStatutDate] = useState({ value: "", hasError: false });
  const cerfaController = useCerfaController();
  const effectifId = useRecoilValue(effectifIdAtom);
  const organisme = useRecoilValue(organismeAtom);

  const onSubmitted = useCallback(
    async (valeur_statut, date_statut) => {
      try {
        await apiService.saveCerfa({
          organisme_id: organisme._id,
          effectifId,
          data: {
            nouveau_statut: {
              valeur: valeur_statut,
              date: date_statut,
            },
          },
          inputNames: ["apprenant.nouveau_statut.valeur_statut", "apprenant.nouveau_statut.date_statut"],
        });
      } catch (e) {
        console.error(e);
      }
    },
    [effectifId, organisme._id]
  );

  console.log(nouveauStatutValeur);

  return (
    <Box>
      <Box my={9}>
        <HStack spacing={4} alignItems="flex-end" h="92px">
          <Flex w="33%" alignItems="flex-end">
            <Input
              {...nouveauStatutValeurField}
              value={nouveauStatutValeur.value}
              onSubmit={(value) => setNouveauStatutValeur({ value, hasError: false })}
              onError={(value) => setNouveauStatutValeur({ value, hasError: true })}
            />
          </Flex>
          <Flex w="33%" alignItems="flex-end">
            <Input
              {...nouveauStatutDateField}
              value={nouveauStatutDate.value}
              onSubmit={(value) => setNouveauStatutDate({ value, hasError: false })}
              onError={(value) => setNouveauStatutDate({ value, hasError: true })}
            />
          </Flex>
          <Flex w="33%" alignItems="center" h="full">
            <Button
              size="md"
              disabled={
                nouveauStatutValeur.hasError ||
                nouveauStatutDate.hasError ||
                nouveauStatutValeur.value === "" ||
                !nouveauStatutDate.value
              }
              onClick={async () => {
                if (!nouveauStatutValeur.hasError && !nouveauStatutDate.hasError) {
                  await onSubmitted(nouveauStatutValeur.value, nouveauStatutDate.value);
                  cerfaController.setField("apprenant.nouveau_statut.valeur_statut", nouveauStatutValeur.value, {
                    triggerSave: false,
                  });
                  cerfaController.setField("apprenant.nouveau_statut.date_statut", nouveauStatutDate.value, {
                    triggerSave: false,
                  });
                }
                return false;
              }}
              variant="primary"
              mt={4}
            >
              + Ajouter le nouveau statut
            </Button>
          </Flex>
        </HStack>

        {values.apprenant.historique_statut?.map((statut, i) => {
          return (
            <Box key={i}>
              <HStack spacing={2} key={i} alignItems="flex-end">
                <InputController name={`apprenant.historique_statut[${i}].valeur_statut`} mb={0} w="33%" />
                <InputController name={`apprenant.historique_statut[${i}].date_statut`} mb={0} w="33%" />
                <Box w="33%" fontStyle="italic" fontSize="0.9rem">
                  Date de réception {statut.date_reception}
                </Box>
              </HStack>
            </Box>
          );
        })}
      </Box>
      <Flex>
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
          <InputController name="apprenant.derniere_situation" />
          <InputController name="apprenant.dernier_diplome" />
          <InputController name="apprenant.regime_scolaire" />
        </Box>
      </Flex>
    </Box>
  );
});
