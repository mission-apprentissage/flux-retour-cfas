import { Container, Heading, Text } from "@chakra-ui/react";

import { Organisme } from "@/common/internal/Organisme";
import SimplePage from "@/components/Page/SimplePage";
import TransmissionByDayTable from "@/modules/transmissions/TransmissionByDayTable";

interface ListeTransmissionsPage {
  organisme: Organisme;
}
const ListeTransmissionsPage = (props: ListeTransmissionsPage) => {
  return (
    <SimplePage>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Mes transmissions
        </Heading>
        <Text mb={16}>
          Visualisez l’état de la donnée des apprenants et leurs contrats transmis ou non, via l’API. L’ensemble des
          éléments manquants et/ou invalides sont listés dans un rapport complet téléchargeable.
        </Text>
        <TransmissionByDayTable organisme={props.organisme}></TransmissionByDayTable>
      </Container>
    </SimplePage>
  );
};

export default ListeTransmissionsPage;
