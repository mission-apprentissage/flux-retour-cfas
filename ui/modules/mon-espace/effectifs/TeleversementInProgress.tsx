import { Heading, Text, VStack } from "@chakra-ui/react";
import React from "react";

const TeleversementInProgress = ({ message, children }: { message: string; children?: React.ReactNode }) => {
  return (
    <VStack>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/televersement.svg" alt="Téléversement en cours" />
      <Heading as="h1" mb={8} mt={6}>
        Traitement en cours...
      </Heading>
      {children || (
        <Text maxWidth={"lg"}>
          Cette opération peut prendre quelques secondes à plusieurs minutes selon la taille du fichier. Merci de votre
          patience.
        </Text>
      )}
      <Text pt={4}>{message}</Text>
    </VStack>
  );
};

export default TeleversementInProgress;
