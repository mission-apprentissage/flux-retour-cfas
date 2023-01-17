import React from "react";
import { Heading, Stack } from "@chakra-ui/react";
import IndicateursInfo from "./common/IndicateursInfos.jsx";
import { SimpleFiltersProvider } from "./common/SimpleFiltersContext.js";

const LandingPilot = () => {
  return (
    <Stack spacing="2w">
      <Heading textStyle="h2" color="grey.800">
        Bienvenue sur votre tableau de bord [PILOT]
      </Heading>

      <SimpleFiltersProvider>
        <IndicateursInfo />
      </SimpleFiltersProvider>
    </Stack>
  );
};

export default LandingPilot;
