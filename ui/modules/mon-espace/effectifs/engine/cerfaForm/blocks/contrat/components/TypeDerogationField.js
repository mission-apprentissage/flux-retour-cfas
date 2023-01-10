import { InputController } from "../../../../formEngine/components/Input/InputController";
import { Text } from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";
import { valueSelector } from "../../../../formEngine/atoms";

export const TypeDerogationField = () => {
  const dateDebutContrat = useRecoilValue(valueSelector("contrat.dateDebutContrat"));
  const apprentiDateNaissance = useRecoilValue(valueSelector("apprenti.dateNaissance"));
  const contratDateDebutContrat = useRecoilValue(valueSelector("contrat.dateDebutContrat"));

  return (
    <>
      <InputController name="contrat.typeDerogation" />
      <Text textStyle="sm" fontStyle="italic">
        à renseigner si une dérogation existe pour ce contrat
      </Text>
      {(dateDebutContrat === "" || apprentiDateNaissance === "") && (
        <Text as={"span"} fontWeight="400" fontStyle="italic" textStyle="sm" opacity={0.8}>
          Pour appliquer une dérogation, merci de renseigner les champs:{" "}
          <Text as={"span"} textDecoration={apprentiDateNaissance === "" ? "underline tomato" : "none"}>
            la date de naissance de l&apos;apprenti
          </Text>
          ,{" "}
          <Text as={"span"} textDecoration={contratDateDebutContrat === "" ? "underline tomato" : "none"}>
            la date de début d&apos;exécution du contrat
          </Text>
        </Text>
      )}
    </>
  );
};
