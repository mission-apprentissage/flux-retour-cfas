import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Box,
  Center,
  Container,
  Divider,
  Grid,
  GridItem,
  Heading,
  HStack,
  Spinner,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";
import {
  getOrganisationLabel,
  OrganisationOperateurPublicAcademie,
  OrganisationOperateurPublicDepartement,
  OrganisationOperateurPublicRegion,
} from "@/common/internal/Organisation";
import { formatNumber, prettyFormatNumber } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import withAuth from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import FiltreDate from "@/modules/indicateurs/filters/FiltreDate";
import FiltreOrganismeTerritoire from "@/modules/indicateurs/filters/FiltreOrganismeTerritoire";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import {
  convertEffectifsFiltersToQuery,
  EffectifsFilters,
  EffectifsFiltersQuery,
  parseEffectifsFiltersFromQuery,
} from "../models/effectifs-filters";
import { IndicateursEffectifsAvecDepartement, IndicateursOrganismesAvecDepartement } from "../models/indicateurs";

import CarteFrance from "./CarteFrance";
import IndicateursGrid from "./IndicateursGrid";

const DashboardTransverse = () => {
  const { auth } = useAuth();
  const router = useRouter();

  const effectifsFilters = useMemo(() => {
    const filters = parseEffectifsFiltersFromQuery(router.query as unknown as EffectifsFiltersQuery);

    // si aucun filtre, on positionne le filtre initial sur le territoire de l'utilisateur
    if (router.asPath === "/") {
      if (
        (auth.organisation as OrganisationOperateurPublicRegion).code_region &&
        filters.organisme_regions.length === 0
      ) {
        filters.organisme_regions = [(auth.organisation as OrganisationOperateurPublicRegion).code_region];
      } else if (
        (auth.organisation as OrganisationOperateurPublicDepartement).code_departement &&
        filters.organisme_departements.length === 0
      ) {
        filters.organisme_departements = [
          (auth.organisation as OrganisationOperateurPublicDepartement).code_departement,
        ];
      } else if (
        (auth.organisation as OrganisationOperateurPublicAcademie).code_academie &&
        filters.organisme_academies.length === 0
      ) {
        filters.organisme_academies = [(auth.organisation as OrganisationOperateurPublicAcademie).code_academie];
      }
    }

    return filters;
  }, [router.query]);

  const { data: indicateursEffectifsAvecDepartement, isLoading: indicateursEffectifsAvecDepartementLoading } = useQuery<
    IndicateursEffectifsAvecDepartement[]
  >(
    ["indicateurs/effectifs", JSON.stringify({ date: effectifsFilters.date.toISOString() })],
    () =>
      _get("/api/v1/indicateurs/effectifs", {
        params: {
          date: effectifsFilters.date,
        },
      }),
    {
      enabled: router.isReady,
    }
  );

  const {
    data: indicateursEffectifsAvecDepartementFiltres,
    isLoading: indicateursEffectifsAvecDepartementFiltresLoading,
  } = useQuery<IndicateursEffectifsAvecDepartement[]>(
    ["indicateurs/effectifs", JSON.stringify(convertEffectifsFiltersToQuery(effectifsFilters))],
    () =>
      _get("/api/v1/indicateurs/effectifs", {
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

  const { data: indicateursOrganismesAvecDepartement, isLoading: indicateursOrganismesAvecDepartementLoading } =
    useQuery<IndicateursOrganismesAvecDepartement[]>(["indicateurs/organismes"], () =>
      _get("/api/v1/indicateurs/organismes")
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
            Bienvenue sur votre tableau de bord, {auth.civility} {auth.prenom} {auth.nom}
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
        <Text fontSize={14} mt="8">
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage&nbsp;:
          <Text as="span" fontWeight="bold">
            {auth.organisation.type === "TETE_DE_RESEAU" && " dans votre réseau"}
          </Text>
          &nbsp;: une partie des organismes de formation en apprentissage ne transmettent pas encore leurs données au
          tableau de bord (voir carte “Taux de couverture” ci-dessous). Ces chiffres reflètent partiellement les
          effectifs de l’apprentissage
        </Text>
        <Text fontSize={14} mt="4">
          Le{" "}
          <strong>
            {effectifsFilters.date.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </strong>
          , le tableau de bord de l’apprentissage recense{" "}
          <strong>{formatNumber(indicateursEffectifsNationaux.apprenants)} apprenants</strong> dans votre territoire,
          dont <strong>{formatNumber(indicateursEffectifsNationaux.apprentis)} apprentis</strong>,{" "}
          <strong>{formatNumber(indicateursEffectifsNationaux.rupturants)} rupturants</strong> et{" "}
          <strong>{formatNumber(indicateursEffectifsNationaux.inscritsSansContrat)} jeunes sans contrat</strong>.
        </Text>
        <HStack mt={8}>
          <Box>Filtrer par</Box>
          <FiltreOrganismeTerritoire
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
            button={({ isOpen, setIsOpen, buttonLabel }) => (
              <SecondarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
                {buttonLabel}
              </SecondarySelectButton>
            )}
          />
          <FiltreDate
            value={effectifsFilters.date}
            onChange={(date) => updateState({ date })}
            button={({ isOpen, setIsOpen, buttonLabel }) => (
              <SecondarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
                {buttonLabel}
              </SecondarySelectButton>
            )}
          />
        </HStack>

        {indicateursEffectifsNationaux && (
          <IndicateursGrid
            indicateursEffectifs={indicateursEffectifsNationaux}
            loading={indicateursEffectifsAvecDepartementFiltresLoading}
          />
        )}

        <Link href="/indicateurs" color="action-high-blue-france" borderBottom="1px">
          Explorer plus d’indicateurs
          <ArrowForwardIcon />
        </Link>

        <Divider size="md" my={8} borderBottomWidth="2px" opacity="1" />

        <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(2, 1fr)" gap={4} my={8}>
          <GridItem bg="galt" py="8" px="12">
            <Heading as="h3" color="#3558A2" fontSize="gamma" fontWeight="700" mb={3}>
              Répartition des effectifs au national
            </Heading>
            <Divider size="md" my={4} borderBottomWidth="2px" opacity="1" />

            {indicateursEffectifsAvecDepartementLoading && (
              <Center h="100%">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
              </Center>
            )}
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
              <Tooltip
                background="bluefrance"
                color="white"
                label={
                  <Box padding="1w">
                    Ce taux traduit le nombre d’organismes dispensant une formation en apprentissage (sauf responsables)
                    qui transmettent au tableau de bord. Les organismes qui transmettent mais ne font pas partie du
                    référentiel ne rentrent pas en compte dans ce taux. Il est conseillé d’avoir un minimum de 80%
                    d’établissements transmetteurs afin de garantir la viabilité des enquêtes menées auprès de ces
                    derniers.
                  </Box>
                }
                aria-label="Informations sur le taux de couverture des organismes"
              >
                <Box
                  as="i"
                  className="ri-information-line"
                  fontSize="epsilon"
                  color="grey.500"
                  marginLeft="1w"
                  verticalAlign="middle"
                />
              </Tooltip>
            </Heading>
            <Divider size="md" my={4} borderBottomWidth="2px" opacity="1" />
            {indicateursOrganismesAvecDepartementLoading && (
              <Center h="100%">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
              </Center>
            )}
            {indicateursOrganismesAvecDepartement && (
              <CarteFrance
                donneesAvecDepartement={indicateursOrganismesAvecDepartement}
                dataKey="tauxCouverture"
                minColor="#ECF5E0"
                maxColor="#4F6C21"
                pourcentage
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

export default withAuth(DashboardTransverse);
