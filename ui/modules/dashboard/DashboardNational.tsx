import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Center, Container, Divider, Grid, GridItem, Heading, HStack, Spinner, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";

import { _get } from "@/common/httpClient";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import { formatNumber, prettyFormatNumber } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import SuggestFeature from "@/components/SuggestFeature/SuggestFeature";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import withAuth from "@/components/withAuth";
import FiltreDate from "@/modules/indicateurs/filters/FiltreDate";

import FiltreOrganismeTerritoire from "../indicateurs/filters/FiltreOrganismeTerritoire";
import {
  convertEffectifsFiltersToQuery,
  DateFilters,
  parseTerritoireFiltersFromQuery,
  TerritoireFilters,
} from "../models/effectifs-filters";

import CarteFrance from "./CarteFrance";
import { useIndicateurNational } from "./hooks/useIndicateursNational";
import IndicateursGrid from "./IndicateursGrid";

const DashboardTransverse = () => {
  const router = useRouter();

  const filters = useMemo(() => parseTerritoireFiltersFromQuery(router.query), [router.query, router.isReady]);

  const indicateursGlobaux = useIndicateurNational({}, router.isReady);
  const { isReady, effectifs, organismes } = useIndicateurNational(filters, router.isReady);
  const tauxCouvertureParDepartement = useMemo(
    () =>
      organismes?.parDepartement.map((d) => ({
        departement: d.departement,
        tauxCouverture: d.tauxCouverture.total,
        totalOrganismes: d.totalOrganismes.total,
        organismesTransmetteurs: d.organismesTransmetteurs.total,
        organismesNonTransmetteurs: d.organismesNonTransmetteurs.total,
      })) ?? [],
    [organismes?.parDepartement]
  );

  const onFilterChange = useCallback(
    (update: Partial<TerritoireFilters & DateFilters>) => {
      router.push(
        {
          pathname: router.pathname,
          query: convertEffectifsFiltersToQuery({ ...filters, ...update }),
        },
        undefined,
        { shallow: true }
      );
    },
    [filters]
  );

  return (
    <Box>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Aperçu des chiffres-clés de l’apprentissage
        </Heading>
        <Text fontSize={14} mt="8">
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage : une partie des organismes de formation
          en apprentissage ne transmettent pas encore leurs données au tableau de bord (voir carte “Taux de couverture”
          ci-dessous).
        </Text>
        <Text fontSize={14} mt="4">
          Le <strong>{formatDateDayMonthYear(new Date())}</strong>, le tableau de bord de l’apprentissage recense{" "}
          <strong>{formatNumber(indicateursGlobaux.effectifs?.total.apprenants)} apprenants</strong>, dont{" "}
          <strong>{formatNumber(indicateursGlobaux.effectifs?.total.apprentis)} apprentis</strong>,{" "}
          <strong>{formatNumber(indicateursGlobaux.effectifs?.total.inscrits)} jeunes en formation sans contrat</strong>{" "}
          et <strong>{formatNumber(indicateursGlobaux.effectifs?.total.rupturants)} rupturants</strong>.
        </Text>
        <HStack mt={8}>
          <Box>Filtrer par</Box>
          <FiltreDate
            value={filters.date}
            onChange={(date) => onFilterChange({ date })}
            button={({ isOpen, setIsOpen, buttonLabel }) => (
              <SecondarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
                {buttonLabel}
              </SecondarySelectButton>
            )}
          />
          <FiltreOrganismeTerritoire
            value={{
              regions: filters.organisme_regions,
              departements: filters.organisme_departements,
              academies: filters.organisme_academies,
              bassinsEmploi: filters.organisme_bassinsEmploi,
            }}
            onRegionsChange={(organisme_regions) => onFilterChange({ organisme_regions })}
            onDepartementsChange={(organisme_departements) => onFilterChange({ organisme_departements })}
            onAcademiesChange={(organisme_academies) => onFilterChange({ organisme_academies })}
            onBassinsEmploiChange={(organisme_bassinsEmploi) => onFilterChange({ organisme_bassinsEmploi })}
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

        {isReady ? (
          <IndicateursGrid indicateursEffectifs={effectifs?.total ?? null} loading={false} />
        ) : (
          <IndicateursGrid loading />
        )}

        <Link href="/indicateurs" color="action-high-blue-france" isUnderlined>
          Explorer plus d’indicateurs
          <ArrowForwardIcon />
        </Link>

        <Divider size="md" my={8} borderBottomWidth="2px" opacity="1" />

        <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(2, 1fr)" gap={4} my={8}>
          <GridItem bg="galt" py="8" px="12">
            <Heading as="h3" color="#3558A2" fontSize="gamma" fontWeight="700" mb={3}>
              Répartition des effectifs au niveau national
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

            {!isReady && (
              <Center h="100%">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
              </Center>
            )}
            {isReady && (
              <CarteFrance
                donneesAvecDepartement={effectifs.parDepartement}
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
              Taux de couverture des organismes au niveau national
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
            {!isReady && (
              <Center h="100%">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
              </Center>
            )}
            {isReady && (
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
