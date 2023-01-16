import React from "react";
import { Heading } from "@chakra-ui/react";
import { SimpleFiltersProvider } from "../LandingOrganisme/SimpleFiltersContext.js";
import PilotIndicateursInfos from "./PilotIndicateursInfos.jsx";

const LandingPilot = () => {
  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5} mb={5}>
        Bienvenue sur votre tableau de bord [PILOT]
      </Heading>

      <SimpleFiltersProvider>
        <PilotIndicateursInfos />
      </SimpleFiltersProvider>
    </>
  );
};

export default LandingPilot;
