import React, { memo } from "react";
import { Box, Button, HStack } from "@chakra-ui/react";
import { InputController } from "../../../../formEngine/components/Input/InputController";
import { fieldSelector, valuesSelector } from "../../../../formEngine/atoms";
import { useRecoilValue } from "recoil";
import { useCerfaController } from "../../../../formEngine/CerfaControllerContext";

// eslint-disable-next-line react/display-name, no-unused-vars
export const ApprenantStatuts = memo(({ modeSifa = false }) => {
  const values = useRecoilValue(valuesSelector);
  const nouveaStatutField = useRecoilValue(fieldSelector("apprenant.nouveau_statut"));
  const cerfaController = useCerfaController();
  return (
    <>
      {values.apprenant.historique_statut?.map((statut, i) => {
        return (
          <Box key={i}>
            <HStack spacing={2} key={i} alignItems="flex-end">
              <InputController name={`apprenant.historique_statut[${i}].valeur_statut`} mb={0} w="33%" />
              <InputController name={`apprenant.historique_statut[${i}].date_statut`} mb={0} w="33%" />
              <Box w="33%" fontStyle="italic" fontSize="0.9rem">
                {i === 0 && nouveaStatutField && (
                  <Button
                    size="md"
                    onClick={async () => {
                      cerfaController.setField("apprenant.nouveau_statut", "trigger", {
                        triggerSave: false,
                      });
                    }}
                    variant="primary"
                    mt={4}
                  >
                    + Ajouter le nouveau statut
                  </Button>
                )}
                {statut.date_reception && `Date de réception ${statut.date_reception}`}
              </Box>
            </HStack>
          </Box>
        );
      })}
    </>
  );
});
