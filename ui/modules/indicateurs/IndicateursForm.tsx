import { EditIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, Flex, Heading, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { IndicateursEffectifsAvecOrganisme, IOrganisationType } from "shared";

import { indicateursParOrganismeExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import NatureOrganismeTooltip from "@/components/Tooltip/NatureOrganismeTooltip";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";
import FiltreApprenantTrancheAge from "@/modules/indicateurs/filters/FiltreApprenantTrancheAge";
import FiltreDate from "@/modules/indicateurs/filters/FiltreDate";
import FiltreFormationAnnee from "@/modules/indicateurs/filters/FiltreFormationAnnee";
import FiltreFormationNiveau from "@/modules/indicateurs/filters/FiltreFormationNiveau";
import FiltreOrganismeReseau from "@/modules/indicateurs/filters/FiltreOrganismeReseau";
import FiltreOrganismeSearch from "@/modules/indicateurs/filters/FiltreOrganismeSearch";

import { useTeteDeReseaux } from "../dashboard/hooks/useTeteDeReseaux";
import { AbandonsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "../dashboard/icons";
import IndicateursGrid from "../dashboard/IndicateursGrid";
import {
  convertEffectifsFiltersToQuery,
  EffectifsFiltersFullQuery,
  parseEffectifsFiltersFullFromQuery,
} from "../models/effectifs-filters";
import {
  convertPaginationInfosToQuery,
  PaginationInfos,
  PaginationInfosQuery,
  parsePaginationInfosFromQuery,
} from "../models/pagination";

import IndicateursFilter from "./FilterAccordion";
import FiltreFormationCFD from "./filters/FiltreFormationCFD";
import FiltreFormationSecteurProfessionnel from "./filters/FiltreFormationSecteurProfessionnel";
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
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { data: reseaux } = useTeteDeReseaux();

  const { organisme: ownOrganisme } = useOrganisationOrganisme(
    organisationType === "ORGANISME_FORMATION" && !!props.organismeId
  );

  const { effectifsFilters, sort } = useMemo(() => {
    const { pagination, sort } = parsePaginationInfosFromQuery(router.query as unknown as PaginationInfosQuery);
    return {
      effectifsFilters: parseEffectifsFiltersFullFromQuery(router.query as unknown as EffectifsFiltersFullQuery),
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

  const prominentOrganismeId = props.organismeId ?? ownOrganisme?._id;
  const prominentOrganisme = (indicateursEffectifs ?? []).find((org) => org.organisme_id === prominentOrganismeId);
  if (prominentOrganisme) {
    (prominentOrganisme as any).prominent = true;
  }

  const indicateursEffectifsTotaux = useMemo(
    () =>
      (indicateursEffectifs ?? []).reduce(
        (acc, indicateursParOrganisme) => {
          acc.apprenants += indicateursParOrganisme.apprenants;
          acc.apprentis += indicateursParOrganisme.apprentis;
          acc.inscrits += indicateursParOrganisme.inscrits;
          acc.abandons += indicateursParOrganisme.abandons;
          acc.rupturants += indicateursParOrganisme.rupturants;
          return acc;
        },
        {
          apprenants: 0,
          apprentis: 0,
          inscrits: 0,
          abandons: 0,
          rupturants: 0,
        }
      ),
    [indicateursEffectifs]
  );

  function updateState(newParams: Partial<{ [key in keyof EffectifsFiltersFullQuery & PaginationInfos]: any }>) {
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

        <SimpleGrid gap={3}>
          <Flex fontWeight="700" textTransform="uppercase">
            <Text>Date</Text>
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
          {organisationType !== "ORGANISME_FORMATION" && (
            <FiltreOrganismeBassinEmploi
              value={effectifsFilters.organisme_bassinsEmploi}
              onChange={(organisme_bassinsEmploi) => updateState({ organisme_bassinsEmploi: organisme_bassinsEmploi })}
            />
          )}
        </SimpleGrid>
        <Text fontWeight="700" textTransform="uppercase">
          Domaine d’activité
        </Text>

        <FiltreFormationSecteurProfessionnel
          value={effectifsFilters.formation_secteursProfessionnels}
          onChange={(secteursProfessionnels) =>
            updateState({ formation_secteursProfessionnels: secteursProfessionnels })
          }
        />

        <SimpleGrid gap={3}>
          <Text fontWeight="700" textTransform="uppercase">
            Formation
          </Text>

          <FiltreFormationCFD
            value={effectifsFilters.formation_cfds}
            onChange={(cfds) => updateState({ formation_cfds: cfds })}
          />

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
                reseaux={reseaux || []}
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
        {!props.organismeId && <MessageBandeauIndicateurs organisationType={organisationType} />}

        <IndicateursGrid
          indicateursEffectifs={indicateursEffectifsTotaux}
          loading={indicateursEffectifsLoading}
          effectifsFilters={effectifsFilters}
          organismeId={props.organismeId}
        />

        <Divider size="md" my={8} borderBottomWidth="2px" opacity="1" />

        <HStack mb="9" justifyContent="space-between">
          <Heading as="h3" fontSize="delta">
            Répartition des effectifs par organismes
          </Heading>

          <DownloadButton
            variant="secondary"
            isDisabled={indicateursEffectifs?.length === 0}
            title={indicateursEffectifs?.length === 0 ? "Aucun organisme à télécharger" : ""}
            action={async () => {
              trackPlausibleEvent("telechargement_liste_repartition_effectifs");
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
          </DownloadButton>
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
                  <NatureOrganismeTooltip />
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
              accessorKey: "inscrits",
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

function MessageBandeauIndicateurs({ organisationType }: { organisationType: IOrganisationType }) {
  let text: string | null | JSX.Element = null;

  switch (organisationType) {
    case "ORGANISME_FORMATION":
      text = (
        <>
          Retrouvez ici les indicateurs et les organismes dont les formations en apprentissage sont{" "}
          <Text as="strong">sous votre gestion</Text> uniquement.
        </>
      );
      break;
    case "TETE_DE_RESEAU":
      text = (
        <>
          Retrouvez ici les indicateurs et les organismes de formation <Text as="strong">de votre réseau</Text>{" "}
          uniquement.
        </>
      );
      break;
    case "DRAAF":
      text = (
        <>
          Retrouvez ici les indicateurs et les organismes de formation <Text as="strong">de votre territoire</Text>{" "}
          uniquement. Vous avez la possibilité de télécharger les listes <Text as="strong">nominatives</Text> pour les
          jeunes en formation sans contrat, rupturants et sorties d&apos;apprentissage.
        </>
      );
      break;
    case "CONSEIL_REGIONAL":
    case "DRAFPIC":
    case "ACADEMIE":
      text = (
        <>
          Retrouvez ici les indicateurs et les organismes de formation <Text as="strong">de votre territoire</Text>{" "}
          uniquement.
        </>
      );
      break;
    case "ADMINISTRATEUR":
      text = (
        <>
          Vous avez la possibilité de télécharger les listes <Text as="strong">nominatives</Text> pour chaque statut.
        </>
      );
  }

  if (text === null) return <></>;

  return (
    <Ribbons>
      <Text color="grey.800" mx={3}>
        {text}
      </Text>
    </Ribbons>
  );
}
