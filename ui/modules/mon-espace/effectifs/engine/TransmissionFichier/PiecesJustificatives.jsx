import React from "react";
import { Box, Text, Center } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import Tooltip from "../../../components/Tooltip/Tooltip";
import { InputController } from "../formEngine/components/Input/InputController";
import { valueSelector } from "../formEngine/atoms";
import { documentsIsRequired } from "./domain/documentsIsRequired";
import UploadFiles from "./components/UploadFiles";

const PiecesJustificatives = () => {
  const typeContratApp = useRecoilValue(valueSelector("contrat.typeContratApp"));
  const documentsRequired = documentsIsRequired(typeContratApp);

  return (
    <Box mt={12} pt={2} minH="25vh">
      {!typeContratApp && (
        <Center>
          <Tooltip variant="alert">
            <Text>
              Veuillez renseigner <strong>le type de contrat</strong> dans le formulaire afin de déterminer quelle(s)
              pièces justificatives sont nécessaires.
            </Text>
          </Tooltip>
        </Center>
      )}
      {typeContratApp && (
        <>
          <UploadFiles
            title={`Convention de formation${!documentsRequired ? " (Optionnel)" : " (Obligatoire)"}`}
            typeDocument="CONVENTION_FORMATION"
          />
          <InputController name="employeur.attestationPieces" mb={2} />
          <Text color="grey.500" fontStyle="italic" fontSize="0.81rem">
            Pendant la durée du contrat d’apprentissage, et après son terme, il peut vous être demandé de fournir
            l’original du contrat signé, les pièces permettant d’attester du <br />
            respect des déclarations figurant dans le contrat d’apprentissage ainsi que la convention de formation, et
            le cas échéant la convention tripartite.
            <br /> Il vous appartient donc de conserver l’ensemble de ces documents originaux.
          </Text>
        </>
      )}
    </Box>
  );
};
// <UploadFiles title="Convention d'aménagement de durée" typeDocument="CONVENTION_REDUCTION_DUREE" />

export default PiecesJustificatives;
