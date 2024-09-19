import { Center, Container, Spinner } from "@chakra-ui/react";

import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme, useOrganisationOrganismes } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import ListeOrganismesPage from "@/modules/organismes/ListeOrganismesPage";

function MesOrganismesFiables() {
  const { organisationType } = useAuth();
  const { organisme: ownOrganisme } = useOrganisationOrganisme(organisationType === "ORGANISME_FORMATION");
  const { organismes } = useOrganisationOrganismes();

  if (!organismes) {
    return (
      <SimplePage title="">
        <Container maxW="xl" p="8">
          <Center>
            <Spinner />
          </Center>
        </Container>
      </SimplePage>
    );
  }

  const prominentOrganismeId = ownOrganisme?._id;
  const prominentOrganisme = (organismes ?? []).find((org) => org._id === prominentOrganismeId);
  if (prominentOrganisme) {
    (prominentOrganisme as any).prominent = true;
  }

  return <ListeOrganismesPage organismes={organismes} modePublique={false} />;
}

export default withAuth(MesOrganismesFiables);
