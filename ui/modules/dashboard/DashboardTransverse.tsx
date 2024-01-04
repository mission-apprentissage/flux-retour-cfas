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
import { useRouter } from "next/router";
import { useMemo } from "react";
import { ACADEMIES_BY_CODE, DEPARTEMENTS_BY_CODE, REGIONS_BY_CODE, TETE_DE_RESEAUX_BY_ID } from "shared";

import { _get } from "@/common/httpClient";
import {
  getOrganisationLabel,
  Organisation,
  OrganisationOperateurPublicAcademie,
  OrganisationOperateurPublicDepartement,
  OrganisationOperateurPublicRegion,
} from "@/common/internal/Organisation";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import { formatCivility, formatNumber, prettyFormatNumber } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import SuggestFeature from "@/components/SuggestFeature/SuggestFeature";
import withAuth from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import FiltreDate from "@/modules/indicateurs/filters/FiltreDate";
import FiltreOrganismeTerritoire from "@/modules/indicateurs/filters/FiltreOrganismeTerritoire";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import DashboardAdministrateur from "../admin/DashboardAdministrateur";
import {
  convertEffectifsFiltersToQuery,
  EffectifsFilters,
  EffectifsFiltersQuery,
  parseEffectifsFiltersFromQuery,
} from "../models/effectifs-filters";

import CarteFrance from "./CarteFrance";
import { useIndicateursEffectifsParDepartement } from "./hooks/useIndicateursEffectifsParDepartement";
import { useIndicateursOrganismesParDepartement } from "./hooks/useIndicateursOrganismesParDepartement";
import IndicateursGrid from "./IndicateursGrid";

function getPerimetreDescription(organisation: Organisation | null): string {
  if (!organisation) {
    return "";
  }

  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      return "Votre périmètre correspond à votre organisme et vos organismes formateurs";
    }

    case "TETE_DE_RESEAU":
      return `Votre périmètre correspond aux organismes du réseau ${TETE_DE_RESEAUX_BY_ID[organisation.reseau]?.nom}`;

    case "DREETS":
    case "DRAAF":
    case "DRAFPIC":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
      return `Votre périmètre correspond aux organismes de la région ${
        REGIONS_BY_CODE[organisation.code_region]?.nom || organisation.code_region
      }`;
    case "DDETS":
      return `Votre périmètre correspond aux organismes du département ${
        DEPARTEMENTS_BY_CODE[organisation.code_departement]?.nom || organisation.code_departement
      }`;
    case "ACADEMIE":
      return `Votre périmètre correspond aux organismes de l'académie de ${
        ACADEMIES_BY_CODE[organisation.code_academie]?.nom || organisation.code_academie
      }`;
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return "Votre périmètre contient tous les organismes nationaux";
  }
}

const DashboardTransverse = () => {
  const { auth, organisation } = useAuth();
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

  const indicateursEffectifs = useIndicateursEffectifsParDepartement({ date: effectifsFilters.date }, router.isReady);
  const indicateursEffectifsFiltres = useIndicateursEffectifsParDepartement(effectifsFilters, router.isReady);

  const indicateursEffectifsAvecDepartement = indicateursEffectifs.parDepartement;
  const indicateursEffectifsAvecDepartementLoading = indicateursEffectifs.isLoading;

  const indicateursEffectifsAvecDepartementFiltresLoading = indicateursEffectifsFiltres.isLoading;
  const indicateursEffectifsNationaux = indicateursEffectifsFiltres.national;

  const { data: indicateursOrganismesAvecDepartement, isLoading: indicateursOrganismesAvecDepartementLoading } =
    useIndicateursOrganismesParDepartement();

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
          Aperçu des données de l’apprentissage de votre périmètre
          <Tooltip
            background="bluefrance"
            color="white"
            label={
              <Box padding="1w">
                <Text as="p">{getPerimetreDescription(organisation)}</Text>
              </Box>
            }
            aria-label="La sélection du mois permet d'afficher les effectifs au dernier jour du mois. À noter : la période de référence pour l'année scolaire court du 1er août au 31 juillet"
          >
            <Box
              as="i"
              className="ri-information-line"
              fontSize="epsilon"
              color="#465F9D"
              verticalAlign="super"
              fontWeight="700"
            />
          </Tooltip>
        </Heading>
        <Text fontSize={14} mt="8">
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage de votre périmètre &nbsp;: une partie
          des organismes de formation en apprentissage ne transmettent pas encore leurs données au tableau de bord (voir
          carte “Taux de couverture” ci-dessous).
        </Text>
        <Text fontSize={14} mt="4">
          Le <strong>{formatDateDayMonthYear(effectifsFilters.date)}</strong>, le tableau de bord de l’apprentissage
          recense <strong>{formatNumber(indicateursEffectifsNationaux.apprenants)} apprenants</strong> dans votre
          périmètre, dont <strong>{formatNumber(indicateursEffectifsNationaux.apprentis)} apprentis</strong>,{" "}
          <strong>
            {formatNumber(indicateursEffectifsNationaux.inscritsSansContrat)} jeunes en formation sans contrat
          </strong>{" "}
          et <strong>{formatNumber(indicateursEffectifsNationaux.rupturants)} rupturants</strong>.
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

          <Tooltip
            background="bluefrance"
            color="white"
            label={
              <Box padding="1w">
                <Text as="p">La sélection du mois permet d&apos;afficher les effectifs au dernier jour du mois.</Text>
                <Text as="p" mt="4">
                  À noter&nbsp;: la période de référence pour l&apos;année scolaire court du 1er août au 31 juillet
                </Text>
              </Box>
            }
            aria-label="La sélection du mois permet d'afficher les effectifs au dernier jour du mois. À noter : la période de référence pour l'année scolaire court du 1er août au 31 juillet"
          >
            <Box
              as="i"
              className="ri-information-line"
              fontSize="epsilon"
              color="grey.500"
              ml="1w"
              fontWeight="normal"
            />
          </Tooltip>
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
              Répartition des effectifs de votre périmètre
              <Tooltip
                background="bluefrance"
                color="white"
                label={
                  <Box padding="1w">
                    Répartition du nombre d’apprenants et de sorties d’apprentissage à l’instant T, par départements.
                    Ces chiffres correspondent aux données à la date du jour, et peuvent varier d’un jour à l’autre
                    selon les données transmises par les organismes de formation en apprentissage.
                  </Box>
                }
                aria-label="Informations sur la répartition des effectifs au national"
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
              Taux de couverture des organismes de votre périmètre
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

        <SuggestFeature />
      </Container>
    </Box>
  );
};

export default withAuth(DashboardTransverse);
