import React, { memo } from "react";
import { InputController } from "../../../formEngine/components/Input/InputController";
import { Box, Flex, FormLabel, HStack } from "@chakra-ui/react";

// eslint-disable-next-line react/display-name
export const EffectifApprenant = memo(() => {
  return (
    <Box>
      <Flex>
        <Box w="55%" flex="1">
          <InputController name="apprenant.ine" />
          <InputController name="apprenant.sexe" />
          <InputController name="apprenant.nom" />
          <InputController name="apprenant.prenom" />
          <InputController name="apprenant.date_de_naissance" />
          <InputController name="apprenant.nationalite" />
          <InputController name="apprenant.handicap" />
          <InputController name="apprenant.courriel" />
          <InputController name="apprenant.telephone" />
          {/* historique_statut */}
        </Box>
        <Box w="45%" ml="5w">
          <FormLabel fontWeight="bold" my={3}>
            Adresse de l&apos;apprenti(e) :
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
        </Box>
      </Flex>
    </Box>
  );
});
