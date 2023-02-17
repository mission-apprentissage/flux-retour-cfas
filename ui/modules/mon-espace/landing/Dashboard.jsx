import React from "react";
import { Heading, Stack, Text } from "@chakra-ui/react";
// import { SimpleFiltersProvider } from "./common/SimpleFiltersContext.js";
// import IndicateursInfo from "./common/IndicateursInfos.jsx";
import ViewSelection from "./visualiser-les-indicateurs/ViewSelection.jsx";

const Dashboard = () => {
  return (
    <Stack spacing="2w">
      <Heading textStyle="h2" color="grey.800">
        Bienvenue sur votre tableau de bord
      </Heading>

      <Text marginTop="3v" fontSize="gamma" color="grey.800">
        Quelle vue souhaitez-vous afficher ?
      </Text>
      <ViewSelection />
      {/* <SimpleFiltersProvider>
        <IndicateursInfo />
      </SimpleFiltersProvider> */}
    </Stack>
  );
};

export default Dashboard;
