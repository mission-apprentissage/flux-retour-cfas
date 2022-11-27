import React from "react";
import { Heading } from "@chakra-ui/react";
import { useEspace } from "../../../../hooks/useEspace";
import OrganismeInfo from "./components/OrganismeInfo";

const LandingOrganisme = () => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Bienvenue sur votre tableau de bord`}
        {isOrganismePages && `Bienvenue sur le tableau de bord de :`}
      </Heading>

      <OrganismeInfo />
    </>
  );
};

export default LandingOrganisme;
