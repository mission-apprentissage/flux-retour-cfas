import { Container, Text } from "@chakra-ui/react";

import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import EffectifCreationPage from "@/modules/effectifs/EffectifCreationPage";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

const NewEffectifPage = () => {
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

  return <EffectifCreationPage organisme={organisme} />;
};

export default withAuth(NewEffectifPage);
