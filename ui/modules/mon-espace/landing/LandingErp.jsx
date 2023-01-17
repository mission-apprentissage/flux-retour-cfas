import React from "react";
import { Heading, Stack } from "@chakra-ui/react";
import { SimpleFiltersProvider } from "./common/SimpleFiltersContext.js";
import IndicateursInfo from "./common/IndicateursInfos.jsx";

const LandingErp = () => {
  return (
    <Stack spacing="2w">
      <Heading textStyle="h2" color="grey.800">
        Bienvenue sur votre tableau de bord [ERP]
      </Heading>

      {/* TODO Voir si on peut récupérer les organismes_id lié à l'ERP comme pour les réseau pour filtrer correctement */}
      <SimpleFiltersProvider>
        <IndicateursInfo />
      </SimpleFiltersProvider>
    </Stack>
  );
};

export default LandingErp;
