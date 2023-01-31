import React from "react";
import { Heading, Stack } from "@chakra-ui/react";
import { useEspace } from "../../../../hooks/useEspace";
import OrganismeInfo from "./components/OrganismeInfo";

const LandingOrganisme = () => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();

  return (
    <Stack spacing="2w">
      <Heading textStyle="h2" color="grey.800">
        {isMonOrganismePages && "Bienvenue sur votre tableau de bord"}
        {isOrganismePages && "Bienvenue sur le tableau de bord de :"}
      </Heading>

      <OrganismeInfo />
    </Stack>
  );
};

export default LandingOrganisme;
