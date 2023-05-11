import { Box, Container, Divider, Grid, GridItem, Heading, HStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";
import { getOrganisationLabel } from "@/common/internal/Organisation";
import { formatDate } from "@/common/utils/dateUtils";
import { stripEmptyFields } from "@/common/utils/misc";
import { prettyFormatNumber } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import useAuth from "@/hooks/useAuth";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import CarteFrance from "./CarteFrance";
import DateFilter from "./filters/DateFilter";
import TerritoireFilter from "./filters/TerritoireFilter";
import { IndicateursEffectifsAvecDepartement, IndicateursOrganismesAvecDepartement } from "./indicateurs";
import IndicateursGrid from "./IndicateursGrid";

interface EffectifsFiltersQuery {
  date: string;
  organisme_regions?: string;
  organisme_departements?: string;
  organisme_academies?: string;
  organisme_bassinsEmploi?: string;
}

interface EffectifsFilters {
  date: Date;
  organisme_regions: string[];
  organisme_departements: string[];
  organisme_academies: string[];
  organisme_bassinsEmploi: string[];
}

function parseEffectifsFiltersFromQuery(query: EffectifsFiltersQuery): EffectifsFilters {
  return {
    date: new Date(query.date ?? Date.now()),
    organisme_regions: query.organisme_regions?.split(",") ?? [],
    organisme_departements: query.organisme_departements?.split(",") ?? [],
    organisme_academies: query.organisme_academies?.split(",") ?? [],
    organisme_bassinsEmploi: query.organisme_bassinsEmploi?.split(",") ?? [],
  };
}

function convertEffectifsFiltersToQuery(query: EffectifsFilters): EffectifsFiltersQuery {
  return stripEmptyFields({
    date: query.date.toISOString(),
    organisme_regions: query.organisme_regions?.join(","),
    organisme_departements: query.organisme_departements?.join(","),
    organisme_academies: query.organisme_academies?.join(","),
    organisme_bassinsEmploi: query.organisme_bassinsEmploi?.join(","),
  });
}

const NewDashboardTransverse = () => {
  const { auth } = useAuth();
  const router = useRouter();

  const effectifsFilters = useMemo(
    () => parseEffectifsFiltersFromQuery(router.query as unknown as EffectifsFiltersQuery),
    [router.query]
  );

  const { data: indicateursEffectifsAvecDepartement } = useQuery<IndicateursEffectifsAvecDepartement[]>(
    ["indicateurs/effectifs", JSON.stringify({ date: effectifsFilters.date.toISOString() })],
    () =>
      _get(`/api/v1/indicateurs/effectifs`, {
        params: {
          date: effectifsFilters.date,
        },
      }),
    {
      enabled: router.isReady,
    }
  );

  const { data: indicateursEffectifsAvecDepartementFiltres } = useQuery<IndicateursEffectifsAvecDepartement[]>(
    ["indicateurs/effectifs", JSON.stringify(convertEffectifsFiltersToQuery(effectifsFilters))],
    () =>
      _get(`/api/v1/indicateurs/effectifs`, {
        params: convertEffectifsFiltersToQuery(effectifsFilters),
      }),
    {
      enabled: router.isReady,
    }
  );

  const indicateursEffectifsNationaux = useMemo(
    () =>
      (indicateursEffectifsAvecDepartementFiltres ?? []).reduce(
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
    [indicateursEffectifsAvecDepartementFiltres]
  );

  const { data: indicateursOrganismesAvecDepartement } = useQuery<IndicateursOrganismesAvecDepartement[]>(
    ["indicateurs/organismes"],
    () => _get(`/api/v1/indicateurs/organismes`)
  );

  function updateState(newParams: Partial<{ [key in keyof EffectifsFilters]: any }>) {
    router.push(
      {
        pathname: router.pathname,
        query: convertEffectifsFiltersToQuery({ ...effectifsFilters, ...newParams }) as any,
      },
      undefined,
      { shallow: true }
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
          Dans votre territoire, le {formatDate(effectifsFilters.date, "dd MMMM yyyy")}.
        </Text>
        <Text fontSize={14}>
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage : une partie des organismes de formation
          ne transmettent pas encore leurs données au tableau de bord.
        </Text>
        <HStack mt={8}>
          <Box>Filtrer par</Box>
          <TerritoireFilter
            value={{
              regions: effectifsFilters.organisme_regions,
              departements: effectifsFilters.organisme_departements,
              academies: effectifsFilters.organisme_academies,
              bassinsEmploi: effectifsFilters.organisme_bassinsEmploi,
            }}
            onRegionsChange={(regions) => updateState({ organisme_regions: regions })}
            onDepartementsChange={(departements) => updateState({ organisme_departements: departements })}
            onAcademiesChange={(academies) => updateState({ organisme_academies: academies })}
            onBassinsEmploiChange={(bassinsEmploi) => updateState({ organisme_bassinsEmploi: bassinsEmploi })}
          />
          <DateFilter value={effectifsFilters.date} onChange={(date) => updateState({ date })} />
        </HStack>

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
