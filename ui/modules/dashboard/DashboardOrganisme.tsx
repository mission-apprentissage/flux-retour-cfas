import { Container, Heading, Stack } from "@chakra-ui/react";

import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";

import OrganismeInfo from "./OrganismeInfo";

const DashboardOrganisme = () => {
  const { organisme } = useOrganisationOrganisme();
  return (
    <Container maxW="xl" p="8">
      <Stack spacing="2w">
        <Heading textStyle="h2" color="grey.800">
          Bienvenue sur votre tableau de bord
        </Heading>

        <OrganismeInfo organisme={organisme} isMine={true} />
      </Stack>
    </Container>
  );
};

export default withAuth(DashboardOrganisme);
