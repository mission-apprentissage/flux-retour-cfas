import React from "react";
import { Heading, Stack } from "@chakra-ui/react";
import { SimpleFiltersProvider } from "./common/SimpleFiltersContext.js";
import IndicateursInfo from "./common/IndicateursInfos.jsx";

const LandingTransverse = () => {
  return (
    <Stack spacing="2w">
      <Heading textStyle="h2" color="grey.800">
        Bienvenue sur votre tableau de bord [TRANSVERSE]
      </Heading>

      <SimpleFiltersProvider>
        <IndicateursInfo />
      </SimpleFiltersProvider>
    </Stack>
  );
};

export default LandingTransverse;
