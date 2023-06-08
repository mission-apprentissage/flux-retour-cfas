import { Box, Container, Heading, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";
import Head from "next/head";

import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import IndicateursGridStack from "@/components/IndicateursGridStack";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import useFetchIndicateursNational from "@/hooks/useFetchIndicateursNational";

const ExplorerLesIndicateursPage = () => {
  const title = "Visualiser les indicateurs en temps réel";
  const date = startOfHour(new Date());
  const { data: effectifsNational, loading } = useFetchIndicateursNational(date);
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]} backgroundColor="galt" paddingY="2w" color="grey.800">
        <Container maxW="xl">
          <Heading textStyle="h2" color="grey.800" mt={5}>
            {title}
          </Heading>
        </Container>
      </Box>
      <Section paddingY="4w" color="grey.800" marginBottom="15w">
        <Heading as="h2" fontSize="gamma">
          Aperçu des données au national le {formatDateDayMonthYear(date)}
        </Heading>
        <Text marginTop="1w" marginBottom="2w" fontStyle="italic" color="grey.800">
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage : une partie des organismes de formation
          ne transmettent pas encore leurs données au tableau de bord.
        </Text>
        <IndicateursGridStack
          effectifs={effectifsNational}
          organismesCount={effectifsNational?.totalOrganismes}
          loading={loading}
        />
      </Section>
    </Page>
  );
};

export default ExplorerLesIndicateursPage;
