import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Center, Container, Grid, GridItem, Heading, HStack, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getOrganisationLabel } from "shared";

import { _get, _post } from "@/common/httpClient";
import { formatCivility } from "@/common/utils/stringUtils";
import { IndicatorCard } from "@/components/Card/IndicatorCard";
import Link from "@/components/Links/Link";
import withAuth from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import { InfoSquare } from "@/theme/components/icons";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import DashboardAdministrateur from "../admin/DashboardAdministrateur";

import { RupturantsIcon, InscritsSansContratsIcon, AbandonsIcon } from "./icons";

const DashboardMissionLocale = () => {
  const { auth } = useAuth();

  const { data: indicateurs, isFetching: isLoading } = useQuery(
    ["mission-locale-indicateurs"],
    () => _get("/api/v1/organisation/mission-locale/indicateurs"),
    { retry: 1 }
  );

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner />
      </Center>
    );
  }

  return (
    <Box>
      <Box
        borderTop="solid 1px"
        borderTopColor="grey.300"
        borderBottom="solid 1px"
        borderBottomColor="grey.300"
        backgroundColor="galt"
        py="4"
        px="8"
      >
        <Container maxW="xl" p="8">
          <Heading textStyle="h2" color="grey.800" size="md">
            <DashboardWelcome mr="2" />
            Bienvenue sur votre tableau de bord, {formatCivility(auth.civility)} {auth.prenom} {auth.nom}
          </Heading>
          <Text color="bluefrance" fontWeight={700} mt="4" textTransform="uppercase">
            {getOrganisationLabel(auth.organisation)}
          </Text>
        </Container>
      </Box>
      <Container maxW="xl" p="8">
        {auth.organisation.type === "ADMINISTRATEUR" && <DashboardAdministrateur />}
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Aperçu des données de l’apprentissage
        </Heading>
        <HStack alignItems={"center"} my={8}>
          <InfoSquare color="bluefrance" bg="white" boxSize="5" />
          <Text>
            Les apprenants restitués sur votre espace sont domiciliés sur votre zone de couverture géographique.
          </Text>
        </HStack>
        <Text fontSize={14}>
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage de votre périmètre : une partie des
          organismes de formation en apprentissage ne transmettent pas encore leurs données au tableau de bord et des
          effectifs issus de la base{" "}
          <Link
            isExternal
            isUnderlined
            color="bluefrance"
            href="https://efpconnect.emploi.gouv.fr/auth/realms/efp/protocol/cas/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F"
          >
            DECA
          </Link>{" "}
          (Dépôt des Contrats d’Alternance) peuvent apparaître pour ces derniers.
        </Text>
        <Text mt={4}>
          Le <strong>{format(new Date(), "dd MMMM yyyy")}</strong>
        </Text>
      </Container>
      <Container maxW="xl" px={8}>
        <Grid templateColumns="repeat(3, 1fr)" gap={4} maxW="xl" mx="auto" minH={200}>
          <GridItem bg="galt">
            <IndicatorCard
              label="jeunes sans contrat"
              count={indicateurs.inscrits}
              tooltipHeader="Jeune sans contrat"
              tooltipLabel={
                <>
                  Un jeune sans contrat est un jeune inscrit qui débute sa formation sans contrat signé en entreprise.
                  Le jeune dispose d’un délai de 3 mois pour trouver son entreprise et continuer sereinement sa
                  formation.
                </>
              }
              icon={<InscritsSansContratsIcon />}
            />
          </GridItem>
          <GridItem bg="galt">
            <IndicatorCard
              label="jeunes en rupture de contrat"
              count={indicateurs.rupturants}
              tooltipHeader="Rupturant"
              tooltipLabel={
                <>
                  Un jeune est considéré en rupture lorsqu’il ne travaille plus dans l’entreprise qui l’accueillait.
                  Néanmoins, il reste inscrit dans le centre de formation et dispose d’un délai de 6 mois pour retrouver
                  une entreprise auprès de qui se former. Il est considéré comme stagiaire de la formation
                  professionnelle.
                </>
              }
              icon={<RupturantsIcon />}
            />
          </GridItem>
          <GridItem bg="galt">
            <IndicatorCard
              label="sorties d’apprentissage"
              count={indicateurs.abandons}
              tooltipHeader="Sorties d’apprentissage (anciennement “abandons”)"
              tooltipLabel={
                <div>
                  Il s’agit du nombre d’apprenants ou apprentis qui ont définitivement quitté le centre de formation à
                  la date affichée. Cette indication est basée sur un statut transmis par les organismes de formation.
                  Ces situations peuvent être consécutives à une rupture de contrat d’apprentissage avec départ du
                  centre de formation, à un départ du centre de formation sans que l’apprenant n’ait jamais eu de
                  contrat, à un départ du centre de formation pour intégrer une entreprise en CDI ou CDD plus
                  rémunérateur.
                </div>
              }
              icon={<AbandonsIcon />}
            />
          </GridItem>
        </Grid>
        <Link isUnderlined href="/mission-locale/apprenants" color="action-high-blue-france" mt={6}>
          Voir la liste nominative des apprenants
          <ArrowForwardIcon ml={1} />
        </Link>
      </Container>
    </Box>
  );
};

export default withAuth(DashboardMissionLocale);
