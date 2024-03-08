import { Container, Text, Heading } from "@chakra-ui/react";

import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import AdminTransmissionByDayTable from "@/modules/admin/transmissions/AdminTransmissionsByDayTable";

const PageTransmissionsAdmin = () => {
  return (
    <SimplePage>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Toutes les transmissions
        </Heading>
        <Text mb={16}>Visualisez l’état des données transmises ou non, jour par jour, par organisme.</Text>
        <AdminTransmissionByDayTable></AdminTransmissionByDayTable>
      </Container>
    </SimplePage>
  );
};

export default withAuth(PageTransmissionsAdmin, ["ADMINISTRATEUR"]);
