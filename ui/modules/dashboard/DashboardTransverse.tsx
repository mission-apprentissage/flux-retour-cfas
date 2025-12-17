import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Center, Container, Divider, Grid, GridItem, Heading, HStack, Spinner, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import {
  ACADEMIES_BY_CODE,
  getOrganisationLabel,
  IOrganisationCreate,
  IOrganisationJson,
  REGIONS_BY_CODE,
} from "shared";

import { _get } from "@/common/httpClient";
import { formatCivility, prettyFormatNumber } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import SuggestFeature from "@/components/SuggestFeature/SuggestFeature";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import withAuth from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import FiltreDate from "@/modules/indicateurs/filters/FiltreDate";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import DashboardAdministrateur from "../admin/DashboardAdministrateur";
import { convertDateFiltersToQuery, parseQueryFieldDate } from "../models/effectifs-filters";

import CarteFrance from "./CarteFrance";
import { useIndicateursEffectifsParDepartement } from "./hooks/useIndicateursEffectifsParDepartement";
import { useIndicateursOrganismesParDepartement } from "./hooks/useIndicateursOrganismesParDepartement";
import IndicateursGrid from "./IndicateursGrid";

function getPerimetreDescription(organisation: IOrganisationJson | null): string {
  if (!organisation) {
    return "";
  }

  switch (organisation.type) {
    case "FRANCE_TRAVAIL":
      return `Votre périmètre correspond au périmètre ${organisation.nom} de France Travail`;
    case "MISSION_LOCALE":
      return `Votre périmètre correspond à la mission locale ${organisation.nom}`;
    case "ARML":
      return `Votre périmètre correspond à l'ARML ${organisation.nom}`;
    case "ORGANISME_FORMATION": {
      return "Votre périmètre correspond à votre organisme et vos organismes formateurs";
    }

    case "TETE_DE_RESEAU":
      return `Votre périmètre correspond aux organismes du réseau ${organisation.reseau}`;

    case "DRAAF":
    case "DRAFPIC":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
      return `Votre périmètre correspond aux organismes de la région ${
        REGIONS_BY_CODE[organisation.code_region]?.nom || organisation.code_region
      }`;
    case "ACADEMIE":
      return `Votre périmètre correspond aux organismes de l'académie de ${
        ACADEMIES_BY_CODE[organisation.code_academie]?.nom || organisation.code_academie
      }`;
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return "Votre périmètre contient tous les organismes nationaux";
    default:
      return "";
  }
}

const DashboardTransverse = () => {
  const { auth, organisation } = useAuth();
  const router = useRouter();

  const filters = useMemo(() => ({ date: parseQueryFieldDate(router.query.date) }), [router.query]);

  const indicateursEffectifs = useIndicateursEffectifsParDepartement(filters, router.isReady);
  const indicateursOrganismes = useIndicateursOrganismesParDepartement(filters.date);
  const tauxCouvertureParDepartement = useMemo(
    () =>
      indicateursOrganismes.data.map((d) => ({
        departement: d.departement,
        tauxCouverture: d.tauxCouverture.total,
        totalOrganismes: d.totalOrganismes.total,
        organismesTransmetteurs: d.organismesTransmetteurs.total,
        organismesNonTransmetteurs: d.organismesNonTransmetteurs.total,
      })),
    [indicateursOrganismes.data]
  );

  const onDateChange = useCallback((date: Date) => {
    router.push(
      {
        pathname: router.pathname,
        query: { date: convertDateFiltersToQuery(date) },
      },
      undefined,
      { shallow: true }
    );
  }, []);

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
            {getOrganisationLabel(auth.organisation as IOrganisationCreate)}
          </Text>
        </Container>
      </Box>
      <Container maxW="xl" p="8">
        {auth.organisation.type === "ADMINISTRATEUR" && <DashboardAdministrateur />}
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Aperçu des données de l’apprentissage de votre périmètre
          <InfoTooltip
            contentComponent={() => (
              <Box>
                <Text as="p">{getPerimetreDescription(organisation)}</Text>
              </Box>
            )}
            aria-label={getPerimetreDescription(organisation)}
          />
        </Heading>
        <Text fontSize={14} mt="8">
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage de votre périmètre&nbsp;: une partie des
          organismes de formation en apprentissage ne transmettent pas encore leurs données au tableau de bord (voir
          carte «&nbsp;Taux de couverture&nbsp;» ci-dessous).
        </Text>
        <HStack mt={8}>
          <Box>Filtrer par</Box>
          <FiltreDate
            value={filters.date}
            onChange={onDateChange}
            button={({ isOpen, setIsOpen, buttonLabel }) => (
              <SecondarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
                {buttonLabel}
              </SecondarySelectButton>
            )}
          />

          <InfoTooltip
            contentComponent={() => (
              <Box>
                <Text as="p">La sélection du mois permet d&apos;afficher les effectifs au dernier jour du mois.</Text>
                <Text as="p" mt="4">
                  À noter&nbsp;: la période de référence pour l&apos;année scolaire court du 1er août au 31 juillet
                </Text>
              </Box>
            )}
            aria-label="La sélection du mois permet d'afficher les effectifs au dernier jour du mois. À noter : la période de référence pour l'année scolaire court du 1er août au 31 juillet"
          />
        </HStack>

        <IndicateursGrid indicateursEffectifs={indicateursEffectifs.total} loading={indicateursEffectifs.isLoading} />

        <Link href="/indicateurs" color="action-high-blue-france" isUnderlined>
          Explorer plus d’indicateurs
          <ArrowForwardIcon />
        </Link>

        <Divider size="md" my={8} borderBottomWidth="2px" opacity="1" />

        <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(2, 1fr)" gap={4} my={8}>
          <GridItem bg="galt" py="8" px="12">
            <Heading as="h3" color="#3558A2" fontSize="gamma" fontWeight="700" mb={3}>
              Répartition des effectifs de votre périmètre
              <InfoTooltip
                contentComponent={() => (
                  <Box>
                    Répartition du nombre d’apprenants et de sorties d’apprentissage à l’instant T, par départements.
                    Ces chiffres correspondent aux données à la date du jour, et peuvent varier d’un jour à l’autre
                    selon les données transmises par les organismes de formation en apprentissage.
                  </Box>
                )}
                aria-label="Informations sur la répartition des effectifs au national"
              />
            </Heading>
            <Divider size="md" my={4} borderBottomWidth="2px" opacity="1" />

            {indicateursEffectifs.isLoading && (
              <Center h="100%">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
              </Center>
            )}
            {!indicateursEffectifs.isLoading && (
              <CarteFrance
                donneesAvecDepartement={indicateursEffectifs.parDepartement}
                dataKey="apprenants"
                minColor="#DDEBFB"
                maxColor="#366EC1"
                tooltipContent={(indicateurs) =>
                  indicateurs ? (
                    <>
                      <Box>Apprenants&nbsp;: {indicateurs.apprenants}</Box>
                      <Box>Apprentis&nbsp;: {indicateurs.apprentis}</Box>
                      <Box>Rupturants&nbsp;: {indicateurs.rupturants}</Box>
                      <Box>Jeunes sans contrat&nbsp;: {indicateurs.inscrits}</Box>
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
              <InfoTooltip
                contentComponent={() => (
                  <Box>
                    Ce taux traduit le nombre d’organismes dispensant une formation en apprentissage (sauf responsables)
                    qui transmettent au tableau de bord. Les organismes qui transmettent mais ne font pas partie du
                    référentiel ne rentrent pas en compte dans ce taux. Il est conseillé d’avoir un minimum de 80%
                    d’établissements transmetteurs afin de garantir la viabilité des enquêtes menées auprès de ces
                    derniers.
                  </Box>
                )}
                aria-label="Informations sur le taux de couverture des organismes"
              />
            </Heading>
            <Divider size="md" my={4} borderBottomWidth="2px" opacity="1" />
            {indicateursOrganismes.isLoading && (
              <Center h="100%">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
              </Center>
            )}
            {!indicateursOrganismes.isLoading && (
              <CarteFrance
                donneesAvecDepartement={tauxCouvertureParDepartement}
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
