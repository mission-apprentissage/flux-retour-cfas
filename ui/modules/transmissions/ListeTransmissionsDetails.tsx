import { ArrowBackIcon, InfoIcon } from "@chakra-ui/icons";
import { Container, Heading, HStack, Tabs, Tab, TabList, TabPanels, TabPanel, Text, Box } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import { EFFECTIFS_GROUP } from "shared";

import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import { transmissionSuccessDetailsCountAtom, transmissionErrorsDetailsCountAtom } from "@/hooks/tranmissions";
import TransmissionSuccessDetailsTable from "@/modules/transmissions/TransmissionsSuccessDetailsTable";

import TransmissionsErrorTab from "./TransmissionsErrorTab";

interface ListeTransmissionsDetailsProps {
  organisme: Organisme;
  date: string;
  modePublique?: boolean;
}

const ListeTransmissionsDetails = ({ organisme, date, modePublique = false }: ListeTransmissionsDetailsProps) => {
  const transmissionSuccessDetailCount = useRecoilValue(transmissionSuccessDetailsCountAtom);
  const transmissionErrorsDetailCount = useRecoilValue(transmissionErrorsDetailsCountAtom);

  const computeBackLinkUrl = () => {
    return modePublique ? `/organismes/${organisme._id}/transmissions` : `/transmissions`;
  };

  return (
    <SimplePage>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Rapport du {formatDateNumericDayMonthYear(date)}
        </Heading>
        <HStack mt={10} mb={10}>
          <Link href={computeBackLinkUrl()} color="action-high-blue-france" isUnderlined>
            <ArrowBackIcon mr={2} />
            Retour au tableau des rapports
          </Link>
          Mes erreurs de transmissions du {formatDateNumericDayMonthYear(date)}
        </HStack>
        <Tabs mt={8}>
          <TabList>
            <Tab fontWeight="bold">Effectifs en échec ({transmissionErrorsDetailCount})</Tab>
            <Tab fontWeight="bold">Effectifs transmis ({transmissionSuccessDetailCount})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px="0">
              <TransmissionsErrorTab organisme={organisme} date={date} />
            </TabPanel>
            <TabPanel px="0">
              <Box mt={10} mb={10}>
                <Text>Identifiez les organismes vers lesquels les effectifs ont été transmis et affectés.</Text>
                <Text color="#0063CB" fontSize={17} mt={5} mb={5}>
                  <InfoIcon mr={2} />
                  Les établissements ci-dessous sont rattachés aux vôtres. Si vous avez une question, ou constatez une
                  anomalie, veuillez{" "}
                  <Link variant="link" color="inherit" href={EFFECTIFS_GROUP} isExternal isUnderlined>
                    nous contacter
                  </Link>
                  .
                </Text>
              </Box>

              <TransmissionSuccessDetailsTable organisme={organisme} date={date}></TransmissionSuccessDetailsTable>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </SimplePage>
  );
};

export default ListeTransmissionsDetails;
