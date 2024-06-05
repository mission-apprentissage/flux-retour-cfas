import { Container, Heading, Text } from "@chakra-ui/react";
import { useEffect } from "react";

import { _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import SimplePage from "@/components/Page/SimplePage";
import TransmissionByDayTable from "@/modules/transmissions/TransmissionByDayTable";

interface ListeTransmissionsPage {
  organisme: Organisme;
}

const ListeTransmissionsPage = (props: ListeTransmissionsPage) => {
  useEffect(() => {
    const resetNotification = async () => {
      if (props.organisme.has_transmission_errors) {
        await _put(`/api/v1/organismes/${props.organisme._id}/transmission/reset-notification`, {});
      }
    };

    resetNotification();
  }, [props.organisme]);

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
