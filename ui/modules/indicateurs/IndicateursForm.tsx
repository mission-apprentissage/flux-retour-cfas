import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, Flex, Heading, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useMemo } from "react";

import { ACADEMIES_BY_CODE, DEPARTEMENTS, DEPARTEMENTS_BY_CODE, REGIONS_BY_CODE } from "@/common/constants/territoires";
import { _get } from "@/common/httpClient";
import { Organisation } from "@/common/internal/Organisation";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import useAuth from "@/hooks/useAuth";
import FiltreApprenantTrancheAge from "@/modules/indicateurs/filters/FiltreApprenantTrancheAge";
import FiltreDate from "@/modules/indicateurs/filters/FiltreDate";
import FiltreFormationAnnee from "@/modules/indicateurs/filters/FiltreFormationAnnee";
import FiltreFormationNiveau from "@/modules/indicateurs/filters/FiltreFormationNiveau";
import FiltreOrganismeReseau from "@/modules/indicateurs/filters/FiltreOrganismeReseau";
import FiltreOrganismeSearch from "@/modules/indicateurs/filters/FiltreOrganismeSearch";
import FiltreOrganismeTerritoire, {
  FiltreOrganismeTerritoireConfig,
} from "@/modules/indicateurs/filters/FiltreOrganismeTerritoire";

import { AbandonsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "../dashboard/icons";
import IndicateursGrid from "../dashboard/IndicateursGrid";
import {
  convertEffectifsFiltersToQuery,
  EffectifsFilters,
  EffectifsFiltersQuery,
  parseEffectifsFiltersFromQuery,
} from "../models/effectifs-filters";
import { IndicateursEffectifsAvecOrganisme } from "../models/indicateurs";
import {
  convertPaginationInfosToQuery,
  PaginationInfos,
  PaginationInfosQuery,
  parsePaginationInfosFromQuery,
} from "../models/pagination";

import IndicateursFilter from "./FilterAccordion";
import FiltreFormationCFD from "./filters/FiltreFormationCFD";
import NatureOrganismeTag from "./NatureOrganismeTag";
import NewTable from "./NewTable";

interface FilterButtonProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  buttonLabel: string;
  isDisabled?: boolean;
}
function FilterButton(props: FilterButtonProps) {
  return (
    <Button
      bg="#F9F8F6"
      variant="unstyled"
      w="100%"
      h={14}
      px={4}
      py={2}
      _hover={{ bg: "var(--chakra-colors-blackAlpha-50);" }}
      onClick={() => props.setIsOpen(!props.isOpen)}
      isActive={props.isOpen}
      isDisabled={props.isDisabled}
    >
      <HStack>
        <Box as="span" flex="1" textAlign="left">
          {props.buttonLabel}
        </Box>
        {props.isOpen ? <MinusIcon fontSize="12px" color="#000091" /> : <AddIcon fontSize="12px" color="#000091" />}
      </HStack>
    </Button>
  );
}

function getFiltreTerritoiresConfig(organisation: Organisation): FiltreOrganismeTerritoireConfig {
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
    case "TETE_DE_RESEAU":
      return {};

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        defaultLabel: REGIONS_BY_CODE[organisation.code_region]?.nom,
        regions: [],
        departements: DEPARTEMENTS.filter((departement) => departement.region.code === organisation.code_region).map(
          (departement) => departement.code
        ),
        academies: [],
      };

    case "DDETS":
      return {
        defaultLabel: DEPARTEMENTS_BY_CODE[organisation.code_departement]?.nom,
        regions: [],
        departements: [],
        academies: [],
      };
    case "ACADEMIE":
      return {
        defaultLabel: ACADEMIES_BY_CODE[organisation.code_academie]?.nom,
        regions: [],
        departements: DEPARTEMENTS.filter(
          (departement) => departement.academie.code === organisation.code_academie
        ).map((departement) => departement.code),
        academies: [],
      };
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
  return {};
}

function IndicateursForm() {
  const { auth } = useAuth();
  const router = useRouter();

  const { effectifsFilters, sort } = useMemo(() => {
    const { pagination, sort } = parsePaginationInfosFromQuery(router.query as unknown as PaginationInfosQuery);
    return {
      effectifsFilters: parseEffectifsFiltersFromQuery(router.query as unknown as EffectifsFiltersQuery),
      pagination: pagination,
      sort: sort ?? [{ desc: false, id: "nom" }],
    };
  }, [JSON.stringify(router.query)]);

  const { data: indicateursEffectifs, isLoading: indicateursEffectifsLoading } = useQuery(
    ["indicateurs/effectifs/par-organisme", JSON.stringify(effectifsFilters)],
    () =>
      _get<IndicateursEffectifsAvecOrganisme[]>("/api/v1/indicateurs/effectifs/par-organisme", {
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

  function updateState(newParams: Partial<{ [key in keyof EffectifsFilters & PaginationInfos]: any }>) {
    void router.push(
      {
        pathname: router.pathname,
        query: {
          ...convertEffectifsFiltersToQuery({ ...effectifsFilters, ...newParams }),
          ...convertPaginationInfosToQuery({ sort, ...newParams }),
        },
      },
      undefined,
      { shallow: true }
    );
  }

  function resetFilters() {
    void router.push(
      {
        pathname: router.pathname,
      },
      undefined,
      { shallow: true }
    );
  }

  return (
    <Flex gap={6}>
      <Box minW="282px" display="grid" gap={5} height="fit-content">
        <HStack>
          <Heading as="h2" fontSize="24px" textTransform="uppercase">
            Filtrer par
          </Heading>
          <Button variant="outline" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </HStack>

        {/* <Box bg="#F5F5FE;" p={4} my={2} textAlign="center">
          Récap des filtres
        </Box> */}

        <SimpleGrid gap={3}>
          <Text fontWeight="700" textTransform="uppercase">
            Date
          </Text>

          <FiltreDate value={effectifsFilters.date} onChange={(date) => updateState({ date })} button={FilterButton} />
        </SimpleGrid>

        <SimpleGrid gap={3}>
          <Text fontWeight="700" textTransform="uppercase">
            Territoire
          </Text>

          <FiltreOrganismeTerritoire
            button={FilterButton}
            value={{
              regions: effectifsFilters.organisme_regions,
              departements: effectifsFilters.organisme_departements,
              academies: effectifsFilters.organisme_academies,
              bassinsEmploi: effectifsFilters.organisme_bassinsEmploi,
            }}
            config={getFiltreTerritoiresConfig(auth.organisation)}
            onRegionsChange={(regions) => updateState({ organisme_regions: regions })}
            onDepartementsChange={(departements) => updateState({ organisme_departements: departements })}
            onAcademiesChange={(academies) => updateState({ organisme_academies: academies })}
            onBassinsEmploiChange={(bassinsEmploi) => updateState({ organisme_bassinsEmploi: bassinsEmploi })}
          />
        </SimpleGrid>
        {/* <Text fontWeight="700" textTransform="uppercase">
          Domaine d’activité
        </Text>
        <IndicateursFilter label="Secteur professionnel">
          <Box>Liste des filtres</Box>
        </IndicateursFilter> */}

        <SimpleGrid gap={3}>
          <Text fontWeight="700" textTransform="uppercase">
            Formation
          </Text>

          <FiltreFormationCFD
            button={FilterButton}
            value={effectifsFilters.formation_cfds}
            onChange={(cfds) => updateState({ formation_cfds: cfds })}
          />

          {/* <IndicateursFilter label="Type de formation">
            <Box>Liste des filtres</Box>
          </IndicateursFilter> */}
          <IndicateursFilter label="Niveau de formation">
            <FiltreFormationNiveau
              value={effectifsFilters.formation_niveaux}
              onChange={(niveaux) => updateState({ formation_niveaux: niveaux })}
            />
          </IndicateursFilter>
          <IndicateursFilter label="Année de formation">
            <FiltreFormationAnnee
              value={effectifsFilters.formation_annees}
              onChange={(annees) => updateState({ formation_annees: annees })}
            />
          </IndicateursFilter>
        </SimpleGrid>

        <SimpleGrid gap={3}>
          <Text fontWeight="700" textTransform="uppercase">
            Apprenant
          </Text>
          <IndicateursFilter label="Tranche d’âge">
            <FiltreApprenantTrancheAge
              value={effectifsFilters.apprenant_tranchesAge}
              onChange={(tranchesAge) => updateState({ apprenant_tranchesAge: tranchesAge })}
            />
          </IndicateursFilter>
          {/* <IndicateursFilter label="Genre">
          <Box>Liste des filtres</Box>
        </IndicateursFilter>
        <IndicateursFilter label="RQTH">
          <Box>Liste des filtres</Box>
        </IndicateursFilter> */}
        </SimpleGrid>

        <SimpleGrid gap={3}>
          <Text fontWeight="700" textTransform="uppercase">
            Organisme
          </Text>
          <IndicateursFilter label="Réseaux d’organismes">
            <FiltreOrganismeReseau
              value={effectifsFilters.organisme_reseaux}
              onChange={(reseaux) => updateState({ organisme_reseaux: reseaux })}
            />
          </IndicateursFilter>
          <IndicateursFilter label="Établissement">
            <FiltreOrganismeSearch
              value={effectifsFilters.organisme_search}
              onChange={(search) => updateState({ organisme_search: search })}
            />
          </IndicateursFilter>
        </SimpleGrid>
      </Box>

      <Box flex="1">
        <Ribbons>
          <Text color="grey.800" mx={3}>
            Retrouvez ici les indicateurs et les organismes de formation de votre territoire uniquement. Vous avez la
            possibilité de télécharger les listes <Text as="strong">nominatives</Text> pour les jeunes en formation sans
            contrat, rupturants et sortis d’apprentissage.
          </Text>
        </Ribbons>

        <IndicateursGrid
          indicateursEffectifs={indicateursEffectifsTotaux}
          loading={indicateursEffectifsLoading}
          showDownloadLinks
          effectifsFilters={effectifsFilters}
        />

        <Divider size="md" my={8} borderBottomWidth="2px" opacity="1" />

        <NewTable
          mt={4}
          data={indicateursEffectifs || []}
          loading={indicateursEffectifsLoading}
          // paginationState={pagination}
          sortingState={sort}
          // onPaginationChange={(state) => updateState({ pagination: state })}
          onSortingChange={(state) => updateState({ sort: state })}
          columns={[
            {
              header: () => "Nom de l’organisme",
              accessorKey: "nom",
              cell: ({ row }) => (
                <>
                  <Link
                    href={`/organismes/${row.original.organisme_id}`}
                    display="block"
                    fontSize="1rem"
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                    overflow="hidden"
                    maxW="250px"
                    title={row.original.nom}
                  >
                    {row.original.nom ?? "Organisme inconnu"}
                  </Link>
                  <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
                    UAI : {row.original.uai} - SIRET : {row.original.siret}
                  </Text>
                </>
              ),
            },
            {
              accessorKey: "nature",
              header: () => "Nature",
              cell: ({ getValue }) => <NatureOrganismeTag nature={getValue()} />,
            },
            {
              accessorKey: "apprentis",
              header: () => (
                <>
                  <ApprentisIcon w="16px" />
                  <Text as="span" ml={2} fontSize="sm">
                    Apprentis
                  </Text>
                </>
              ),
            },
            {
              accessorKey: "inscritsSansContrat",
              header: () => (
                <>
                  <InscritsSansContratsIcon w="16px" />
                  <Text as="span" ml={2} fontSize="sm">
                    Sans contrat
                  </Text>
                </>
              ),
            },
            {
              accessorKey: "rupturants",
              header: () => (
                <>
                  <RupturantsIcon w="16px" />
                  <Text as="span" ml={2} fontSize="sm">
                    Ruptures
                  </Text>
                </>
              ),
            },
            {
              accessorKey: "abandons",
              header: () => (
                <>
                  <AbandonsIcon w="16px" />
                  <Text as="span" ml={2} fontSize="sm">
                    Sorties
                  </Text>
                </>
              ),
            },
          ]}
        />
      </Box>
    </Flex>
  );
}

export default IndicateursForm;
