import { Center, Container, Spinner } from "@chakra-ui/react";

import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganismes } from "@/hooks/organismes";
import ListeOrganismesPage from "@/modules/organismes/ListeOrganismesPage";

function MesOrganismesACompleter() {
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

  return <ListeOrganismesPage organismes={organismes} activeTab="a-completer" modePublique={false} />;
}

export default withAuth(MesOrganismesACompleter);