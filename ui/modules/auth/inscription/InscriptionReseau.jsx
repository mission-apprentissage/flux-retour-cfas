import React from "react";

import { Box, Text } from "@chakra-ui/react";
import { SiretBlock } from "./components/SiretBlock";

export const InscriptionReseau = ({ onEtablissementSelected }) => {
  return (
    <>
      <Text fontWeight="bold">Vous représentez un réseau d&rsquo;organismes de formation</Text>
      <Box mt="2w">
        <SiretBlock onSiretFetched={onEtablissementSelected} />
      </Box>
    </>
  );
};
