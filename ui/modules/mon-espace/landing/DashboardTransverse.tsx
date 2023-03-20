import React from "react";
import { Heading, Stack } from "@chakra-ui/react";
import ViewSelection from "./visualiser-les-indicateurs/ViewSelection.jsx";

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
