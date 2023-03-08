import React from "react";
import Head from "next/head";
import { Box, Container, Heading, HStack, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";

import Page from "@/components/Page/Page";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import { Padlock } from "../theme/components/icons";
import Link from "@/components/Links/Link";

import Section from "@/components/Section/Section";
import useFetchIndicateursNational from "../hooks/useFetchIndicateursNational";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import IndicateursGridStack from "@/components/IndicateursGridStack";

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
          <Breadcrumb pages={[PAGES.monEspace(), { title }]} />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            {title}
          </Heading>
          <HStack fontSize="epsilon" spacing="2w" paddingY="2w">
            <Box>
              <Padlock color="bluefrance" marginTop="-1w" flex="1" width="18px" height="20px" />
              <Text as="span" marginLeft="1w">
                Merci de vous connecter pour consulter l’intégralité des données.
              </Text>
            </Box>
            <Box color="bluefrance" flex="2">
              <Link href="/auth/connexion" variant="link" fontSize="epsilon">
                <Box as="span" verticalAlign="middle">
                  Connexion
                </Box>
                <Box as="i" className="ri-arrow-right-line" marginLeft="1w" verticalAlign="middle" />
              </Link>
            </Box>
          </HStack>
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
