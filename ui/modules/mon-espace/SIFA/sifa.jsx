import React from "react";
import { Heading, HStack, Spinner, Text } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";

const EnqueteSIFA = () => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Mon Enquete SIFA2`}
        {isOrganismePages && `Son Enquete SIFA2`}
      </Heading>
      <HStack spacing={3} mt={5}>
        <Spinner />
        <Text>Génération de votre fichier pour l&rsquo;enquête SIFA en cours...</Text>
      </HStack>
    </>
  );
};

export default EnqueteSIFA;
