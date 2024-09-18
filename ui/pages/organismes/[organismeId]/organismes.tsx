import { Center, Container, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import ListeOrganismesPage from "@/modules/organismes/ListeOrganismesPage";

function SesOrganismesFiables() {
  const router = useRouter();
  const organismeId = router.query.organismeId as string;
  const { data: organismes } = useQuery<Organisme[]>(
    ["organismes", organismeId, "organismes"],
    () => _get(`/api/v1/organismes/${organismeId}/organismes`),
    {
      enabled: !!organismeId,
    }
  );

  if (!organismes) {
    return (
      <SimplePage>
        <Container maxW="xl" p="8">
          <Center>
            <Spinner />
          </Center>
        </Container>
      </SimplePage>
    );
  }

  const prominentOrganisme = organismes.find((org) => org._id === organismeId);
  if (prominentOrganisme) {
    (prominentOrganisme as any).prominent = true;
  }

  return <ListeOrganismesPage organismes={organismes} modePublique={true} organismeId={organismeId} />;
}

export default withAuth(SesOrganismesFiables);
