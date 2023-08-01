import { EditIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, Flex, Heading, HStack, SimpleGrid, Text, Tooltip } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { indicateursParOrganismeExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { OrganisationType } from "@/common/internal/Organisation";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import DownloadLinkButton from "@/components/buttons/DownloadLinkButton";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import TooltipNatureOrganisme from "@/components/tooltips/TooltipNatureOrganisme";
import { useOrganisme } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import FiltreApprenantTrancheAge from "@/modules/indicateurs/filters/FiltreApprenantTrancheAge";
import FiltreDate from "@/modules/indicateurs/filters/FiltreDate";
import FiltreFormationAnnee from "@/modules/indicateurs/filters/FiltreFormationAnnee";
import FiltreFormationNiveau from "@/modules/indicateurs/filters/FiltreFormationNiveau";
import FiltreOrganismeReseau from "@/modules/indicateurs/filters/FiltreOrganismeReseau";
import FiltreOrganismeSearch from "@/modules/indicateurs/filters/FiltreOrganismeSearch";

import { AbandonsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "../dashboard/icons";
import IndicateursGrid, { typesEffectifNominatif } from "../dashboard/IndicateursGrid";
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
import FiltreOrganismeAcademie from "./filters/FiltreOrganismeAcademie";
import FiltreOrganismeBassinEmploi from "./filters/FiltreOrganismeBassinEmploi";
import FiltreOrganismeDepartement from "./filters/FiltreOrganismeDepartement";
import FiltreOrganismeRegion from "./filters/FiltreOrganismeRegion";
import NatureOrganismeTag from "./NatureOrganismeTag";
import NewTable from "./NewTable";

interface IndicateursFormProps {
  organismeId?: string;
}
function IndicateursForm(props: IndicateursFormProps) {
  const { auth, organisationType } = useAuth();
  const router = useRouter();

  const { organisme } = useOrganisme(props.organismeId);

  const { effectifsFilters, sort } = useMemo(() => {
    const { pagination, sort } = parsePaginationInfosFromQuery(router.query as unknown as PaginationInfosQuery);
    return {
      effectifsFilters: parseEffectifsFiltersFromQuery(router.query as unknown as EffectifsFiltersQuery),
      pagination: pagination,
      sort: sort ?? [{ desc: false, id: "nom" }],
    };
  }, [JSON.stringify(router.query)]);

  const { data: indicateursEffectifs, isLoading: indicateursEffectifsLoading } = useQuery(
    [props.organismeId, "indicateurs/effectifs/par-organisme", JSON.stringify(effectifsFilters)],
    () =>
      _get<IndicateursEffectifsAvecOrganisme[]>(
        `/api/v1${props.organismeId ? `/organismes/${props.organismeId}` : ""}/indicateurs/effectifs/par-organisme`,
        {
          params: convertEffectifsFiltersToQuery(effectifsFilters),
        }
      ),
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
          ...(props.organismeId ? { organismeId: props.organismeId } : {}),
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
        query: {
          ...(props.organismeId ? { organismeId: props.organismeId } : {}),
        },
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
          <Flex fontWeight="700" textTransform="uppercase">
            <Text>Date</Text>
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
          </Flex>

          <FiltreDate
            value={effectifsFilters.date}
            onChange={(date) => updateState({ date })}
            button={({ isOpen, setIsOpen, buttonLabel }) => (
              <Button
                bg="#F9F8F6"
                variant="unstyled"
                w="100%"
                h={14}
                px={4}
                py={2}
                _hover={{ bg: "var(--chakra-colors-blackAlpha-50);" }}
                onClick={() => setIsOpen(!isOpen)}
                isActive={isOpen}
              >
                <HStack>
                  <Box as="span" flex="1" textAlign="left">
                    {buttonLabel}
                  </Box>
                  <EditIcon fontSize="16px" color="#000091" />
                </HStack>
              </Button>
            )}
          />
        </SimpleGrid>

        <SimpleGrid gap={3}>
          <Text fontWeight="700" textTransform="uppercase">
            Territoire
          </Text>

          <FiltreOrganismeRegion
            value={effectifsFilters.organisme_regions}
            onChange={(regions) => updateState({ organisme_regions: regions })}
          />
          <FiltreOrganismeDepartement
            value={effectifsFilters.organisme_departements}
            onChange={(departements) => updateState({ organisme_departements: departements })}
          />
          <FiltreOrganismeAcademie
            value={effectifsFilters.organisme_academies}
            onChange={(academies) => updateState({ organisme_academies: academies })}
          />
          {organisationType !== "ORGANISME_FORMATION_FORMATEUR" &&
            organisationType !== "ORGANISME_FORMATION_RESPONSABLE" &&
            organisationType !== "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR" && (
              <FiltreOrganismeBassinEmploi
                value={effectifsFilters.organisme_bassinsEmploi}
                onChange={(organisme_bassinsEmploi) =>
                  updateState({ organisme_bassinsEmploi: organisme_bassinsEmploi })
                }
              />
            )}
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
            value={effectifsFilters.formation_cfds}
            onChange={(cfds) => updateState({ formation_cfds: cfds })}
          />

          {/* <IndicateursFilter label="Type de formation">
            <Box>Liste des filtres</Box>
          </IndicateursFilter> */}
          <IndicateursFilter label="Niveau de formation" badge={effectifsFilters.formation_niveaux.length}>
            <FiltreFormationNiveau
              value={effectifsFilters.formation_niveaux}
              onChange={(niveaux) => updateState({ formation_niveaux: niveaux })}
            />
          </IndicateursFilter>
          <IndicateursFilter label="Année de formation" badge={effectifsFilters.formation_annees.length}>
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
          <IndicateursFilter label="Tranche d’âge" badge={effectifsFilters.apprenant_tranchesAge.length}>
            <FiltreApprenantTrancheAge
              value={effectifsFilters.apprenant_tranchesAge}
              onChange={(tranchesAge) => updateState({ apprenant_tranchesAge: tranchesAge })}
            />
          </IndicateursFilter>
          <IndicateursFilter label="Genre">
            <Text as="i" color="grey.600">
              Filtre bientôt disponible
            </Text>
          </IndicateursFilter>
        </SimpleGrid>

        <SimpleGrid gap={3}>
          <Text fontWeight="700" textTransform="uppercase">
            Organisme
          </Text>
          {auth.organisation.type !== "TETE_DE_RESEAU" && (
            <IndicateursFilter label="Réseau d’organismes" badge={effectifsFilters.organisme_reseaux.length}>
              <FiltreOrganismeReseau
                value={effectifsFilters.organisme_reseaux}
                onChange={(reseaux) => updateState({ organisme_reseaux: reseaux })}
              />
            </IndicateursFilter>
          )}
          <IndicateursFilter label="Établissement" badge={effectifsFilters.organisme_search ? 1 : undefined}>
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
            contrat, rupturants et sorties d’apprentissage.
          </Text>
        </Ribbons>

        <IndicateursGrid
          indicateursEffectifs={indicateursEffectifsTotaux}
          loading={indicateursEffectifsLoading}
          permissionEffectifsNominatifs={
            props.organismeId
              ? organisme?.permissions?.effectifsNominatifs
              : getPermissionsEffectifsNominatifs(organisationType)
          }
          effectifsFilters={effectifsFilters}
          organismeId={props.organismeId}
        />

        <Divider size="md" my={8} borderBottomWidth="2px" opacity="1" />

        <HStack mb="9" justifyContent="space-between">
          <Heading as="h3" fontSize="delta">
            Répartition des effectifs par organismes
          </Heading>

          <DownloadLinkButton
            action={async () => {
              const effectifsWithoutOrganismeId = (indicateursEffectifs ?? []).map(
                ({ organisme_id, apprenants, ...effectif }) => effectif // eslint-disable-line @typescript-eslint/no-unused-vars
              );
              exportDataAsXlsx(
                `tdb-indicateurs-organismes-${effectifsFilters.date.toISOString().substring(0, 10)}.xlsx`,
                effectifsWithoutOrganismeId,
                indicateursParOrganismeExportColumns
              );
            }}
          >
            Télécharger la liste
          </DownloadLinkButton>
        </HStack>

        <NewTable
          data={indicateursEffectifs || []}
          loading={indicateursEffectifsLoading}
          noDataMessage="Aucun organisme ne semble correspondre aux filtres que vous avez sélectionnés"
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
              header: () => (
                <>
                  Nature
                  <TooltipNatureOrganisme />
                </>
              ),
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

function getPermissionsEffectifsNominatifs(
  organisationType: OrganisationType
): boolean | Array<(typeof typesEffectifNominatif)[number]> {
  switch (organisationType) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
      return true;

    case "TETE_DE_RESEAU":
      return false;

    case "DREETS":
    case "DRAAF":
      return ["inscritSansContrat", "rupturant", "abandon"];
    case "CONSEIL_REGIONAL":
      return false;
    case "DDETS":
      return ["inscritSansContrat", "rupturant", "abandon"];
    case "ACADEMIE":
      return false;

    case "OPERATEUR_PUBLIC_NATIONAL":
      return false;

    case "ADMINISTRATEUR":
      return true;
  }
  return false;
}
