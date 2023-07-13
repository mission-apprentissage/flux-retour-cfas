import {
  Box,
  Center,
  Container,
  Heading,
  ListItem,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  UnorderedList,
} from "@chakra-ui/react";
import { SortingState } from "@tanstack/react-table";
import { isBefore, subMonths } from "date-fns";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

import { _get } from "@/common/httpClient";
import { OrganisationType } from "@/common/internal/Organisation";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { normalize } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import TooltipNatureOrganisme from "@/components/tooltips/TooltipNatureOrganisme";
import { useOrganisationOrganismes } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import NatureOrganismeTag from "@/modules/indicateurs/NatureOrganismeTag";
import NewTable from "@/modules/indicateurs/NewTable";
import { convertPaginationInfosToQuery } from "@/modules/models/pagination";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import { ArrowDropRightLine } from "@/theme/components/icons";

type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

// L’ordre est celui des tabs
const tabs = [
  {
    key: "fiables",
    route: "/organismes",
    index: 0,
  },
  {
    key: "non-fiables",
    route: "/organismes/non-fiables",
    index: 1,
  },
] as const;

interface ListeOrganismesPageProps {
  activeTab: (typeof tabs)[number]["key"];
}

function ListeOrganismesPage(props: ListeOrganismesPageProps) {
  const router = useRouter();
  const { organisationType } = useAuth();
  const { isLoading, organismes } = useOrganisationOrganismes();

  // FIXME Mes / Ses organismes
  const title = `Mes organismes${props.activeTab === "non-fiables" ? " non fiables" : ""}`;

  const { organismesFiables, organismesNonFiables } = useMemo(() => {
    const organismesFiables: OrganismeNormalized[] = [];
    const organismesNonFiables: OrganismeNormalized[] = [];
    (organismes || []).forEach((organisme: OrganismeNormalized) => {
      // We need to memorize organismes with normalized names to be avoid running the normalization on each keystroke.
      organisme.normalizedName = normalize(organisme.nom ?? "");
      organisme.normalizedUai = normalize(organisme.uai ?? "");
      organisme.normalizedCommune = normalize(organisme.adresse?.commune ?? "");

      if (organisme.fiabilisation_statut === "FIABLE" && !organisme.ferme) {
        organismesFiables.push(organisme);
      } else {
        organismesNonFiables.push(organisme);
      }
    });

    return {
      organismesFiables,
      organismesNonFiables,
    };
  }, [organismes]);

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {getHeaderTitleFromOrganisationType(organisationType)}
        </Heading>

        <Text>Retrouver ci-dessous&nbsp;:</Text>
        <UnorderedList styleType="'- '">
          <ListItem>
            les <strong>{organismesFiables.length}</strong> établissements <strong>fiables</strong> de votre territoire
            et la nature de chacun (inclus les prépa-apprentissage, CFA académiques, d’entreprise, etc…)
          </ListItem>
          <ListItem>
            les <strong>{organismesNonFiables.length}</strong> établissements <strong>non-fiabilisés</strong>
          </ListItem>
        </UnorderedList>
        <Text fontStyle="italic">Source : Catalogue et Référentiel de l’apprentissage</Text>

        <Tabs
          isLazy
          index={tabs.find((tab) => tab.key === props.activeTab)?.index}
          lazyBehavior="keepMounted"
          onChange={(index) => {
            router.push(tabs[index]?.route);
          }}
          mt="12"
        >
          <TabList>
            <Tab fontWeight="bold">Organismes fiables ({organismesFiables.length})</Tab>
            <Tab fontWeight="bold">Organismes à fiabiliser ({organismesNonFiables.length})</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Ribbons variant="info" my={8}>
                <Box color="grey.800">
                  <Text>Est considéré comme fiable un organisme (OFA)&nbsp;:</Text>
                  <UnorderedList styleType="'- '">
                    <ListItem>
                      qui correspond à un couple UAI-SIRET <strong>validé</strong> dans le{" "}
                      <Link
                        href="https://referentiel.apprentissage.onisep.fr/"
                        isExternal={true}
                        borderBottom="1px"
                        _hover={{ textDecoration: "none" }}
                      >
                        Référentiel de l’apprentissage
                      </Link>
                      .
                    </ListItem>
                    <ListItem>
                      dont l’état administratif du SIRET de l’établissement, tel qu’il est renseigné sur l’INSEE, est{" "}
                      <strong>ouvert</strong>.
                    </ListItem>
                  </UnorderedList>
                </Box>
              </Ribbons>
              <OrganismesTable organismes={organismesFiables} isLoading={isLoading} />
            </TabPanel>
            <TabPanel>
              <Ribbons variant="warning" my={8}>
                <Box color="grey.800">
                  <Text>
                    Un organisme (OFA) est considéré comme non-fiable lorsqu’il présente l’une des caractéristiques
                    suivantes&nbsp;:
                  </Text>
                  <UnorderedList styleType="'- '">
                    <ListItem>
                      Son couple UAI-SIRET n’est pas <strong>validé</strong> dans le{" "}
                      <Link
                        href="https://referentiel.apprentissage.onisep.fr/"
                        isExternal={true}
                        borderBottom="1px"
                        _hover={{ textDecoration: "none" }}
                      >
                        Référentiel de l’apprentissage
                      </Link>
                      .
                    </ListItem>
                    <ListItem>
                      Son code UAI est répertorié comme <strong>inconnu</strong> ou non <strong>validé</strong> dans le{" "}
                      <Link
                        href="https://referentiel.apprentissage.onisep.fr/"
                        isExternal={true}
                        borderBottom="1px"
                        _hover={{ textDecoration: "none" }}
                      >
                        Référentiel de l’apprentissage
                      </Link>
                      .
                    </ListItem>
                    <ListItem>
                      L’état administratif du SIRET de l’établissement, tel qu’il est enregistré auprès de l’INSEE, est{" "}
                      <strong>fermé</strong>.
                    </ListItem>
                  </UnorderedList>
                  <Text>
                    Un organisme est considéré comme non-fiable dès lors qu’il remplit au moins l’une de ces conditions.
                  </Text>
                  <Text fontWeight="bold">
                    Veuillez contacter les organismes non-fiables pour encourager une action auprès de leur Carif-Oref
                    ou de l’INSEE.
                  </Text>
                </Box>
              </Ribbons>
              <OrganismesTable organismes={organismesNonFiables} isLoading={isLoading} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </SimplePage>
  );
}

export default ListeOrganismesPage;

interface OrganismesTableProps {
  organismes: OrganismeNormalized[];
  isLoading: boolean;
  // TODO mode fiable non fiable
}
function OrganismesTable(props: OrganismesTableProps) {
  const defaultSort: SortingState = [{ desc: false, id: "nom" }];
  const router = useRouter();
  const [searchValue, setSearchValue] = useState<string>(String(router.query.search ?? ""));
  const [sort, setSort] = useState<SortingState>(defaultSort);

  // Init search value and sort from query on load.
  useEffect(() => {
    if (!router.isReady) return;
    const search = router.query.search;
    const sort = router.query.sort;
    if (search && search !== searchValue) setSearchValue(search as string);
    if (sort) {
      setSort(defaultSort);
      try {
        const parsedSort = JSON.parse(sort as string);
        if (isSortingState(parsedSort)) setSort(parsedSort);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }, [router.isReady]);

  // Update router on search value or sort change.
  useEffect(() => {
    if (!router.isReady) return;
    const query = { search: searchValue ?? undefined, ...convertPaginationInfosToQuery({ sort }) };
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [searchValue, sort, router.isReady]);

  // Simple search: filter organismes by name that contains the search value.
  const filteredOrganismes = useMemo(() => {
    if (searchValue.length < 2) return props.organismes;

    const normalizedSearchValue = normalize(searchValue);
    return props.organismes.filter(
      (organisme) =>
        organisme.normalizedName.includes(normalizedSearchValue) ||
        organisme.normalizedUai?.startsWith(normalizedSearchValue) ||
        organisme.siret?.startsWith(normalizedSearchValue) ||
        organisme.normalizedCommune.startsWith(normalizedSearchValue)
    );
  }, [props.organismes, searchValue]);

  return (
    <>
      {props.isLoading && !props.organismes && (
        <Center>
          <Spinner />
        </Center>
      )}
      {!props.isLoading && props.organismes && (
        <>
          <Input
            {...{
              name: "search_organisme",
              fieldType: "text",
              mask: "C",
              maskBlocks: [
                {
                  name: "C",
                  mask: "Pattern",
                  pattern: "^.*$",
                },
              ],
              placeholder: "Rechercher un organisme par nom, UAI, SIRET ou ville (indiquez au moins deux caractères)",
              value: searchValue,
              onSubmit: (value: string) => setSearchValue(value.trim()),
            }}
          />

          <NewTable
            mt={4}
            data={filteredOrganismes || []}
            loading={false}
            sortingState={sort}
            onSortingChange={(state) => setSort(state)}
            columns={[
              {
                header: () => "Nom de l’organisme",
                accessorKey: "nom",
                cell: ({ row }) => (
                  <>
                    <Link
                      href={`/organismes/${(row.original as any)?._id}`}
                      display="block"
                      fontSize="1rem"
                      width="var(--chakra-sizes-lg)"
                      title={row.original.nom}
                    >
                      {row.original.nom ?? "Organisme inconnu"}
                    </Link>
                    <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
                      UAI&nbsp;: {(row.original as any).uai} - SIRET&nbsp;: {(row.original as any).siret}
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
                accessorKey: "last_transmission_date",
                header: () => "Transmission au tdb",
                cell: ({ getValue }) => {
                  const lastTransmissionDate = getValue();
                  if (!lastTransmissionDate) return <Text color="tomato">Ne transmet pas</Text>;
                  if (isMoreThanOrEqualOneMonthAgo(lastTransmissionDate)) {
                    return (
                      <Text color="orange">
                        Ne transmet plus <br />
                        depuis le {formatDateNumericDayMonthYear(lastTransmissionDate)}
                      </Text>
                    );
                  }
                  return <Text color="green">{formatDateNumericDayMonthYear(lastTransmissionDate)}</Text>;
                },
              },
              {
                accessorKey: "ferme",
                header: () => (
                  <>
                    État
                    <Tooltip
                      background="bluefrance"
                      color="white"
                      label={
                        <Box padding="1w">
                          <b>État de l’établissement</b>
                          <Text as="p">
                            Indication de l’état administratif du SIRET de l’établissement, tel qu’il est renseigné sur
                            l’INSEE. Si cette information est erronée, merci de leur signaler.
                          </Text>
                        </Box>
                      }
                      aria-label="Indication de l’état administratif du SIRET de l’établissement, tel qu’il est renseigné
                  sur l’INSEE."
                    >
                      <Box
                        as="i"
                        className="ri-information-line"
                        fontSize="epsilon"
                        color="grey.500"
                        marginLeft="1v"
                        verticalAlign="middle"
                      />
                    </Tooltip>
                  </>
                ),
                cell: ({ getValue }) => (
                  <div>
                    {getValue() ? (
                      <Text color="flatwarm" fontWeight="bold">
                        Fermé
                      </Text>
                    ) : (
                      <Text>Ouvert</Text>
                    )}
                  </div>
                ),
              },
              {
                accessorKey: "adresse",
                sortingFn: (a, b) => {
                  const communeA = a.original.adresse?.commune || "";
                  const communeB = b.original.adresse?.commune || "";
                  return communeA.localeCompare(communeB);
                },
                header: () => (
                  <>
                    Localisation
                    <Tooltip
                      background="bluefrance"
                      color="white"
                      label={
                        <Box padding="1w">
                          <Text as="p">
                            Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille
                            physiquement les apprentis et les forme.
                          </Text>
                        </Box>
                      }
                      aria-label="Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille
            physiquement les apprentis et les forme."
                    >
                      <Box
                        as="i"
                        className="ri-information-line"
                        fontSize="epsilon"
                        color="grey.500"
                        marginLeft="1v"
                        verticalAlign="middle"
                      />
                    </Tooltip>
                  </>
                ),
                cell: ({ row }) => (
                  <Box>
                    {row.original.adresse?.commune || ""}
                    <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
                      {row.original.adresse?.code_postal || ""}
                      {row.original.adresse?.code_insee &&
                      row.original.adresse?.code_postal !== row.original.adresse?.code_insee
                        ? ` (Insee: ${row.original.adresse?.code_insee})`
                        : ""}
                    </Text>
                  </Box>
                ),
              },
              {
                accessorKey: "more",
                enableSorting: false,
                header: () => "Voir",
                cell: ({ row }) => (
                  <Link href={`/organismes/${(row.original as any)?._id}`} flexGrow={1}>
                    <ArrowDropRightLine />
                  </Link>
                ),
              },
            ]}
          />
        </>
      )}
    </>
  );
}

function getHeaderTitleFromOrganisationType(type: OrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
      return "Mes organismes formateurs";

    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}

function isSortingState(value: any): value is SortingState {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && "id" in item && "desc" in item);
}

function isMoreThanOrEqualOneMonthAgo(date: Date | string) {
  const oneMonthAgo = subMonths(new Date(), 1);
  const dateAsDate = typeof date === "string" ? new Date(date) : date;
  return isBefore(dateAsDate, oneMonthAgo) || dateAsDate.getTime() === oneMonthAgo.getTime();
}
