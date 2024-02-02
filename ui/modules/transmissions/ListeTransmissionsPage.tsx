import { Container, Heading } from "@chakra-ui/react";

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
        <TransmissionByDayTable organisme={props.organisme}></TransmissionByDayTable>
      </Container>
    </SimplePage>
  );
};

export default ListeTransmissionsPage;
