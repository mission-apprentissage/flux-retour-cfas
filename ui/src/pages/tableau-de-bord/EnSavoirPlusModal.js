import { Box, Text, useDisclosure } from "@chakra-ui/react";
import React from "react";

import { InfoModal } from "../../common/components";

const EnSavoirPlusModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Box as="span" onClick={onOpen} textDecoration="underline" cursor="pointer" color="bluefrance">
        en savoir plus
      </Box>

      <InfoModal title="En savoir plus" onClose={onClose} isOpen={isOpen}>
        <Text color="grey.800">
          <strong>Le tableau de bord de l’apprentissage</strong> est construit par l&apos;équipe de la Mission
          Interministérielle pour faciliter les entrées en Apprentissage.{" "}
          <strong>
            Il vise à mettre en visibilité l’évolution des effectifs et des formations en apprentissage en temps réel, à
            permettre une meilleure coordination des acteurs.
          </strong>
        </Text>
        <Text color="grey.800" marginTop="2w">
          Il est élaboré à partir des données transmises par les centres de formation via leur éditeur de logiciel ou
          une API.{" "}
          <strong>
            Ce tableau n&apos;a pas de valeur statistique mais sert à donner des indices à tous les acteurs pour piloter
            les formations à différents niveaux de granularité.
          </strong>
        </Text>
      </InfoModal>
    </>
  );
};

export default EnSavoirPlusModal;
