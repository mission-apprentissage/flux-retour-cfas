import { Box, Container, Divider, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";
import { getOrganisationLabel } from "@/common/internal/Organisation";
import { prettyFormatNumber } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import useAuth from "@/hooks/useAuth";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import CarteFrance from "./CarteFrance";
import { IndicateursEffectifsAvecDepartement, IndicateursOrganismesAvecDepartement } from "./indicateurs";
import IndicateursGrid from "./IndicateursGrid";

const NewDashboardTransverse = () => {
  const { auth } = useAuth();

  const { data: indicateursEffectifsAvecDepartement } = useQuery<IndicateursEffectifsAvecDepartement[]>(
    ["indicateurs/effectifs"],
    () =>
      _get(`/api/v1/indicateurs/effectifs`, {
        params: {
          date: "2023-05-09",
        },
      }) // TODO filtres
  );

  const indicateursEffectifsNationaux = useMemo(
    () =>
      (indicateursEffectifsAvecDepartement ?? []).reduce(
        (acc, indicateursDepartement) => {
          acc.apprenants += indicateursDepartement.apprenants;
          acc.apprentis += indicateursDepartement.apprentis;
          acc.inscritsSansContrat += indicateursDepartement.inscritsSansContrat;
          acc.abandons += indicateursDepartement.abandons;
          acc.rupturants += indicateursDepartement.rupturants;
          return acc;
        },
        {
          apprenants: 0,
          apprentis: 0,
          inscritsSansContrat: 0,
          abandons: 0,
          rupturants: 0,
        }
      ),
    [indicateursEffectifsAvecDepartement]
  );

  const { data: indicateursOrganismesAvecDepartement } = useQuery<IndicateursOrganismesAvecDepartement[]>(
    ["indicateurs/organismes"],
    () =>
      _get(`/api/v1/indicateurs/organismes`, {
        params: {},
      }) // TODO filtres
  );

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
            Bienvenue sur votre tableau de bord {auth.civility} {auth.prenom} {auth.nom}
          </Heading>
          <Text color="bluefrance" fontWeight={700} mt="4" textTransform="uppercase">
            {getOrganisationLabel(auth.organisation)}
          </Text>
        </Container>
      </Box>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Aperçu des données de l’apprentissage
        </Heading>
        <Text fontSize={14} fontWeight="bold" mt="8">
          Dans votre territoire, le DATE. {/* FIXME récupérer la date du filtre */}
        </Text>
        <Text fontSize={14}>
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage : une partie des organismes de formation
          ne transmettent pas encore leurs données au tableau de bord.
        </Text>
        <Box>Filtrer par...</Box>

        {indicateursEffectifsNationaux && <IndicateursGrid indicateursEffectifs={indicateursEffectifsNationaux} />}

        <Link href="/indicateurs" color="action-high-blue-france" textDecoration="underline">
          Explorer plus d’indicateurs
        </Link>

        <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(2, 1fr)" gap={4} my={8}>
          <GridItem bg="galt" py="8" px="12">
            <Heading as="h3" color="#3558A2" fontSize="gamma" fontWeight="700" mb={3}>
              Répartition des effectifs dans votre territoire
            </Heading>
            <Divider size="md" my={4} borderBottomWidth="2px" opacity="1" />
            {indicateursEffectifsAvecDepartement && (
              <CarteFrance
                donneesAvecDepartement={indicateursEffectifsAvecDepartement}
                dataKey="apprenants"
                minColor="#DDEBFB"
                maxColor="#366EC1"
                tooltipContent={(indicateurs) =>
                  indicateurs ? (
                    <>
                      <Box>Apprenants&nbsp;: {indicateurs.apprenants}</Box>
                      <Box>Apprentis&nbsp;: {indicateurs.apprentis}</Box>
                      <Box>Rupturants&nbsp;: {indicateurs.rupturants}</Box>
                      <Box>Jeunes sans contrat&nbsp;: {indicateurs.inscritsSansContrat}</Box>
                      <Box>Sorties d’apprentissage&nbsp;: {indicateurs.abandons}</Box>
                    </>
                  ) : (
                    <Box>Données non disponibles</Box>
                  )
                }
              />
            )}
          </GridItem>

          <GridItem bg="galt" py="8" px="12">
            <Heading as="h3" color="#3558A2" fontSize="gamma" fontWeight="700" mb={3}>
              Taux de couverture des organismes
            </Heading>
            <Divider size="md" my={4} borderBottomWidth="2px" opacity="1" />
            {indicateursOrganismesAvecDepartement && (
              <CarteFrance
                donneesAvecDepartement={indicateursOrganismesAvecDepartement}
                dataKey="tauxCouverture"
                minColor="#ECF5E0"
                maxColor="#4F6C21"
                tooltipContent={(indicateurs) =>
                  indicateurs ? (
                    <>
                      <Box>Taux de couverture&nbsp;: {prettyFormatNumber(indicateurs.tauxCouverture)}%</Box>
                      <Box>Total des organismes&nbsp;: {indicateurs.totalOrganismes}</Box>
                      <Box>Organismes transmetteurs&nbsp;: {indicateurs.organismesTransmetteurs}</Box>
                      <Box>Organismes non-transmetteurs&nbsp;: {indicateurs.organismesNonTransmetteurs}</Box>
                    </>
                  ) : (
                    <Box>Données non disponibles</Box>
                  )
                }
              />
            )}
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default NewDashboardTransverse;
