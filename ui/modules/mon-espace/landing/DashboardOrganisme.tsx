import { Heading, Stack } from "@chakra-ui/react";
import React from "react";

import { useOrganisationOrganisme } from "@/hooks/organismes";

import OrganismeInfo from "./LandingOrganisme/components/OrganismeInfo";

const DashboardOrganisme = () => {
  const { organisme } = useOrganisationOrganisme();
  return (
    <Stack spacing="2w">
      <Heading textStyle="h2" color="grey.800">
        Bienvenue sur votre tableau de bord
      </Heading>

      <OrganismeInfo organisme={organisme} isMine={true} />
    </Stack>
  );
};

export default DashboardOrganisme;
