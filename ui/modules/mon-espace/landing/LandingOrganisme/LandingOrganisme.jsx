import React from "react";
import { Heading } from "@chakra-ui/react";
import { useEspace } from "../../../../hooks/useEspace";
import { useOrganisme } from "../../../../hooks/useOrganisme";
import OrganismeInfo from "./components/OrganismeInfo";

const LandingOrganisme = () => {
  const { myOrganisme, isMonOrganismePages, isOrganismePages } = useEspace();
  const { organisme } = useOrganisme();

  const curentOrganisme = myOrganisme || organisme;

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Bienvenue sur votre tableau de bord`}
        {isOrganismePages && `Bienvenue sur le tableau de bord de :`}
      </Heading>

      <OrganismeInfo organisme={curentOrganisme} />
    </>
  );
};

export default LandingOrganisme;
