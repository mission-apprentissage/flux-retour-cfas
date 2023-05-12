import { InfoOutlineIcon } from "@chakra-ui/icons";
import { Flex, Button, HStack, Text, Box, Heading, Divider, Center, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";
import Ribbons from "@/components/Ribbons/Ribbons";
import Table from "@/components/Table/Table";

import { InscritsSansContratsIcon, AbandonsIcon, RupturantsIcon, ApprentisIcon } from "../dashboard/icons";
import IndicateursGrid from "../dashboard/IndicateursGrid";
import {
  convertEffectifsFiltersToQuery,
  EffectifsFiltersQuery,
  parseEffectifsFiltersFromQuery,
} from "../models/effectifs-filters";
import { IndicateursEffectifsAvecOrganisme } from "../models/indicateurs";

import IndicateursFilter from "./FilterAccordion";
import NatureOrganismeTag from "./NatureOrganismeTag";

function IndicateursForm() {
  const router = useRouter();

  const effectifsFilters = useMemo(() => {
    const filters = parseEffectifsFiltersFromQuery(router.query as unknown as EffectifsFiltersQuery);

    return filters;
  }, [router.query]);

  const { data: indicateursEffectifs, isLoading: indicateursEffectifsLoading } = useQuery<
    IndicateursEffectifsAvecOrganisme[]
  >(
    ["indicateurs/effectifs/par-organisme", JSON.stringify(convertEffectifsFiltersToQuery(effectifsFilters))],
    () =>
      _get("/api/v1/indicateurs/effectifs/par-organisme", {
        params: convertEffectifsFiltersToQuery(effectifsFilters),
      }),
    {
      enabled: router.isReady,
    }
  );

  const indicateursEffectifsTotaux = useMemo(
    () =>
      (indicateursEffectifs ?? []).reduce(
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
    [indicateursEffectifs]
  );

  return (
    <Flex gap={6}>
      <Box minW="280px" display="grid" gap={1}>
        <HStack>
          <Heading as="h2" fontSize="24px" textTransform="uppercase">
            Filtrer par
          </Heading>
          <Button variant="outline">Réinitialiser</Button>
        </HStack>

        {/* <Box bg="#F5F5FE;" p={4} my={2} textAlign="center">
          Récap des filtres
        </Box> */}

        <Text fontWeight="700" textTransform="uppercase">
          Date
        </Text>
        <IndicateursFilter label="[5 avril 2023]">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>

        <Text fontWeight="700" textTransform="uppercase">
          Territoire
        </Text>
        <IndicateursFilter label="Territoire">
          {/* TODO TerritoireFilter */}
          <Box>Liste des filtres</Box>
        </IndicateursFilter>

        {/* <Text fontWeight="700" textTransform="uppercase">
          Domaine d’activité
        </Text>
        <IndicateursFilter label="Secteur professionnel">
          <Box>Liste des filtres</Box>
        </IndicateursFilter> */}

        <Text fontWeight="700" textTransform="uppercase">
          Formation
        </Text>
        <IndicateursFilter label="Type de formation">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>
        <IndicateursFilter label="Niveau de formation">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>
        <IndicateursFilter label="Année de formation">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>

        <Text fontWeight="700" textTransform="uppercase">
          Apprenant
        </Text>
        <IndicateursFilter label="Tranche d’âge">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>
        <IndicateursFilter label="Genre">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>
        <IndicateursFilter label="RQTH">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>

        <Text fontWeight="700" textTransform="uppercase">
          Organisme
        </Text>
        <IndicateursFilter label="Établissement">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>
        <IndicateursFilter label="Réseaux d’organismes">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>
      </Box>

      <Box flex="1">
        <Ribbons>
          <Text color="grey.800" mx={3}>
            Retrouvez ici les indicateurs et les organismes de formation de votre territoire uniquement.
          </Text>
        </Ribbons>

        <IndicateursGrid indicateursEffectifs={indicateursEffectifsTotaux} loading={indicateursEffectifsLoading} />

        <Divider size="md" my={8} borderBottomWidth="2px" opacity="1" />

        {indicateursEffectifsLoading && (
          <Center h="200px">
            <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
          </Center>
        )}
        {indicateursEffectifs && (
          <Table
            mt={4}
            data={indicateursEffectifs}
            columns={{
              nom: {
                size: 1000,
                header: () => (
                  <Text as="span" px={3} fontSize="sm" whiteSpace="nowrap" lineHeight="10">
                    Nom de l’organisme
                  </Text>
                ),
                cell: ({ row }) => (
                  <>
                    <Text
                      fontSize="1rem"
                      px={3}
                      pt={2}
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      title={row.original.nom}
                    >
                      {row.original.nom}
                    </Text>
                    <Text fontSize="xs" px={3} py={2} color="#777777">
                      UAI : {row.original.uai} - SIRET :{row.original.siret}
                    </Text>
                  </>
                ),
              },
              nature: {
                size: 1,
                header: () => (
                  <Box px={2} whiteSpace="nowrap">
                    <Text as="span" px={2} fontSize="sm">
                      Nature
                    </Text>
                    <InfoOutlineIcon w="20px" h="20px" />
                  </Box>
                ),
                cell: ({ getValue }) => (
                  <Box px={2}>
                    <NatureOrganismeTag nature={getValue()} />
                  </Box>
                ),
              },
              apprentis: {
                size: 1,
                header: () => (
                  <Box px={2} whiteSpace="nowrap">
                    <ApprentisIcon />
                    <Text as="span" ml={2} fontSize="sm">
                      Apprentis
                    </Text>
                  </Box>
                ),
                cell: ({ getValue }) => (
                  <Text fontSize="1rem" px={2}>
                    {getValue()}
                  </Text>
                ),
              },
              inscritsSansContrat: {
                size: 1,
                header: () => (
                  <Box px={2} whiteSpace="nowrap">
                    <InscritsSansContratsIcon />
                    <Text as="span" ml={2} fontSize="sm">
                      Sans contrat
                    </Text>
                  </Box>
                ),
                cell: ({ getValue }) => (
                  <Text fontSize="1rem" px={2}>
                    {getValue()}
                  </Text>
                ),
              },
              rupturants: {
                size: 1,
                header: () => (
                  <Box px={2} whiteSpace="nowrap">
                    <RupturantsIcon />
                    <Text as="span" ml={2} fontSize="sm">
                      Ruptures
                    </Text>
                  </Box>
                ),
                cell: ({ getValue }) => (
                  <Text fontSize="1rem" px={2}>
                    {getValue()}
                  </Text>
                ),
              },
              abandons: {
                size: 1,
                header: () => (
                  <Box px={2} whiteSpace="nowrap">
                    <AbandonsIcon />
                    <Text as="span" ml={2} fontSize="sm">
                      Sorties
                    </Text>
                  </Box>
                ),
                cell: ({ getValue }) => (
                  <Text fontSize="1rem" px={2}>
                    {getValue()}
                  </Text>
                ),
              },
            }}
          />
        )}
      </Box>
    </Flex>
  );
}

export default IndicateursForm;
