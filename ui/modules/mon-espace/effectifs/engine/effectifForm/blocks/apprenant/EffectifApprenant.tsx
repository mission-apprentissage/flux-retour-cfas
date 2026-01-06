import { Box, Flex, FormLabel, HStack, Text } from "@chakra-ui/react";
import React, { memo } from "react";
import { useRecoilValue } from "recoil";

import { _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { CollapseController } from "@/modules/mon-espace/effectifs/engine/formEngine/components/CollapseController";
import { InputController } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/InputController";

import { shouldAskRepresentantLegal } from "./domain/shouldAskRepresentantLegal";
import { shouldAskResponsalLegalAdresse } from "./domain/shouldAskResponsalLegalAdresse";

// eslint-disable-next-line react/display-name
export const EffectifApprenant = memo(({ apprenant }: { apprenant: any }) => {
  const organisme = useRecoilValue<Organisme | null | undefined>(organismeAtom);

  if (!organisme) return null;

  return (
    <Box my={6}>
      <Flex>
        <Box w="55%" flex="1">
          <InputController name="apprenant.ine" />
          <InputController name="apprenant.sexe" />
          <InputController name="apprenant.nom" />
          <InputController name="apprenant.prenom" />
          <InputController name="apprenant.date_de_naissance" />
          <InputController name="apprenant.adresse_naissance.code_postal" />
          <InputController name="apprenant.nationalite" />
          <InputController name="apprenant.rqth" />
          <InputController name="apprenant.date_rqth" />
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
              <InputController name="apprenant.representant_legal.pcs" />
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
            {apprenant.adresse?.complete && (
              <Box fontWeight="bold">Infomation ERP/API: {apprenant.adresse.complete}</Box>
            )}
            {!apprenant.adresse?.complete && (
              <HStack>
                <Text>
                  {apprenant.adresse.numero} {apprenant.adresse.repetition_voie} {apprenant.adresse.voie}
                </Text>
                <Text>{apprenant.adresse.complement}</Text>
                <Text>
                  {apprenant.adresse.code_postal} {apprenant.adresse.commune}
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
          <InputController
            name="apprenant.type_cfa"
            onApplyAll={async () => {
              if (confirm("Êtes-vous sûr de vouloir appliquer ce paramètre à tous les effectifs ?"))
                await _put(`/api/v1/organismes/${organisme._id}/effectifs`, {
                  "apprenant.type_cfa": apprenant.type_cfa,
                });
            }}
          />
          <InputController name="apprenant.dernier_organisme_uai" />
          <InputController name="apprenant.derniere_situation" />
          <InputController name="apprenant.dernier_diplome" />
          <InputController name="apprenant.regime_scolaire" />
        </Box>
      </Flex>
    </Box>
  );
});
