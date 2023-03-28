import React from "react";
import { Heading, Stack } from "@chakra-ui/react";
import OrganismeInfo from "./LandingOrganisme/components/OrganismeInfo";
import { useOrganisationOrganisme } from "@/hooks/useOrganisationOrganisme";

const DahsboardOrganisme = () => {
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

export default DahsboardOrganisme;
