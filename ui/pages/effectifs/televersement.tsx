import { Container, Text } from "@chakra-ui/react";

import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import Televersement from "@/modules/organismes/Televersement";

function TeleversementPage() {
  const { organisme } = useEffectifsOrganismeOrganisation();
  if (!organisme) {
    return (
      <SimplePage>
        <Container maxW="xl" p="8">
          <Text mb={16}>Vous ne disposez pas des droits nécessaires pour visualiser cette page.</Text>
        </Container>
      </SimplePage>
    );
  }

  return <Televersement organismeId={organisme._id} isMine={true} />;
}

export default withAuth(TeleversementPage);
