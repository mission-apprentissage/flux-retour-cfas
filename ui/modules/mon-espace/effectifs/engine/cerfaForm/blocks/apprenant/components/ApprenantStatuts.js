import React, { memo, useCallback, useState } from "react";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";
import { InputController } from "../../../../formEngine/components/Input/InputController";
import { fieldSelector, valuesSelector } from "../../../../formEngine/atoms";
import { useRecoilValue } from "recoil";
import { Input } from "../../../../formEngine/components/Input/Input";
import { useCerfaController } from "../../../../formEngine/CerfaControllerContext";
import { apiService } from "../../../../services/api.service";
import { effectifIdAtom } from "../../../../atoms";
import { organismeAtom } from "../../../../../../../../hooks/organismeAtoms";

// eslint-disable-next-line react/display-name
export const ApprenantStatuts = memo(({ modeSifa = false }) => {
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

  return (
    <>
      {!modeSifa && (
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
      )}

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
    </>
  );
});
