import { ArrowBackIcon } from "@chakra-ui/icons";
import { Container, Heading } from "@chakra-ui/react";

import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import TransmissionDetailsTable from "@/modules/transmissions/TransmissionDetailsTable";

interface ListeTransmissionsDetailsProps {
  organisme: Organisme;
  date: string;
}
const ListeTransmissionsDetails = (props: ListeTransmissionsDetailsProps) => {
  return (
    <SimplePage>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Mes transmissions
        </Heading>
        <Heading as="h2" size="md" mb="4w">
          <Link href={`/transmissions`} flexGrow={1}>
            <ArrowBackIcon mr={2} />
          </Link>
          Mes erreurs de transmissions du {formatDateNumericDayMonthYear(props.date)}
        </Heading>
        <TransmissionDetailsTable organisme={props.organisme} date={props.date}></TransmissionDetailsTable>
      </Container>
    </SimplePage>
  );
};

export default ListeTransmissionsDetails;
