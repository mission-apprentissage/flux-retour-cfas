import React from "react";

import { Box, Text } from "@chakra-ui/react";
import { SiretBlock } from "./components/SiretBlock";

export const InscriptionPilot = ({ onEndOfSpecific }) => {
  return (
    <>
      <Text fontWeight="bold">
        Vous représentez un opérateur public (dreets, deets, draaf, académie, conseil régional...)
      </Text>
      <Box mt="2w">
        <SiretBlock onSiretFetched={onEndOfSpecific} />
      </Box>
    </>
  );
};
