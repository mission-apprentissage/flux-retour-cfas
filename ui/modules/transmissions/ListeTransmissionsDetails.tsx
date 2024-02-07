import { ArrowBackIcon } from "@chakra-ui/icons";
import { Container, Heading, HStack } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";

import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import { transmissionDetailsCountAtom } from "@/hooks/tranmissions";
import TransmissionDetailsTable from "@/modules/transmissions/TransmissionDetailsTable";

interface ListeTransmissionsDetailsProps {
  organisme: Organisme;
  date: string;
}

const ListeTransmissionsDetails = (props: ListeTransmissionsDetailsProps) => {
  const transmissionDetailCount = useRecoilValue(transmissionDetailsCountAtom);
  return (
    <SimplePage>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Rapport du {formatDateNumericDayMonthYear(props.date)}
        </Heading>
        <HStack mt={10} mb={10}>
          <Link
            href={`/transmissions`}
            color="action-high-blue-france"
            borderBottom="1px"
            _hover={{ textDecoration: "none" }}
          >
            <ArrowBackIcon mr={2} />
            Retour au tableau des rapports
          </Link>
          Mes erreurs de transmissions du {formatDateNumericDayMonthYear(props.date)}
        </HStack>
        <Heading as="h2" size="md" mb="4w">
          Visualisez les {transmissionDetailCount} effectifs en échec
        </Heading>
        <TransmissionDetailsTable organisme={props.organisme} date={props.date}></TransmissionDetailsTable>
      </Container>
    </SimplePage>
  );
};

export default ListeTransmissionsDetails;
