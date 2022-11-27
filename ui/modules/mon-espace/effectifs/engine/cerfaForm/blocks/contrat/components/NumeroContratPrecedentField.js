import { InputController } from "../../../../formEngine/components/Input/InputController";
import { Box, Text } from "@chakra-ui/react";
import { departements } from "../../../../../../common/constants/departements";
import React, { useMemo } from "react";
import { fieldSelector } from "../../../../formEngine/atoms";
import { useRecoilValue } from "recoil";
import { CollapseController } from "../../../../formEngine/components/CollapseController";
import { shouldAskNumeroContratPrecedent } from "../domain/shouldAskContratPrecedent";

export const NumeroContratPrecedentField = () => {
  const numeroContratPrecedentField = useRecoilValue(fieldSelector("contrat.numeroContratPrecedent"));
  const numeroContratPrecedent = numeroContratPrecedentField.value;

  const contratPrecedentDetails = useMemo(
    () => ({
      departement: numeroContratPrecedent?.substr(0, 3),
      annee: numeroContratPrecedent?.substr(3, 4),
      mois: numeroContratPrecedent?.substr(7, 2),
      Nc: numeroContratPrecedent?.substr(9, 2),
    }),
    [numeroContratPrecedent]
  );

  return (
    <>
      <CollapseController show={shouldAskNumeroContratPrecedent}>
        <InputController name="contrat.numeroContratPrecedent" />
      </CollapseController>
      {numeroContratPrecedent !== "" && numeroContratPrecedentField.success && (
        <Box>
          <Text fontWeight="400" fontStyle="italic">
            Information sur le précedent contrat:
            <br /> {contratPrecedentDetails.mois}/{contratPrecedentDetails.annee}
            {", "}
            {departements[contratPrecedentDetails.departement]?.name} ({contratPrecedentDetails.departement})
            {contratPrecedentDetails.Nc === "NC" && ", non conforme."}
          </Text>
        </Box>
      )}
    </>
  );
};
