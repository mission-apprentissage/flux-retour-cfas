import { Heading, Stack } from "@chakra-ui/react";
import React from "react";

import ViewSelection from "./visualiser-les-indicateurs/ViewSelection";

const DashboardTransverse = () => {
  return (
    <Stack spacing="2w">
      <Heading textStyle="h2" color="grey.800">
        Bienvenue sur votre tableau de bord
      </Heading>

      {/* Anciens écrans d'indicateurs, qu'il faudra supprimer / adapter une fois les nouvelles maquettes prêtes */}
      <ViewSelection />
    </Stack>
  );
};

export default DashboardTransverse;
