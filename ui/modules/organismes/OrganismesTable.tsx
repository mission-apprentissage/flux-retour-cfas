import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Divider,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  ListItem,
  Text,
  Tooltip,
  UnorderedList,
} from "@chakra-ui/react";
import { AccessorKeyColumnDef, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDate } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { normalize } from "@/common/utils/stringUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import TooltipNatureOrganisme from "@/components/tooltips/TooltipNatureOrganisme";
import { usePlausibleTracking } from "@/hooks/plausible";
import NatureOrganismeTag from "@/modules/indicateurs/NatureOrganismeTag";
import NewTable from "@/modules/indicateurs/NewTable";
import { convertPaginationInfosToQuery } from "@/modules/models/pagination";
import { ArrowDropRightLine } from "@/theme/components/icons";

import InfoTransmissionDonnees from "./InfoTransmissionDonnees";
import OrganismesFilterPanel, { OrganismeFiltersListVisibilityProps } from "./OrganismesFilterPanel";

type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

const organismesTableColumnsDefs: AccessorKeyColumnDef<OrganismeNormalized, any>[] = [
  {
    header: () => "Nom de l’organisme",
    accessorKey: "normalizedName",
    cell: ({ row }) => (
      <>
        <Link
          href={`/organismes/${(row.original as any)?._id}`}
          display="block"
          fontSize="1rem"
          width="var(--chakra-sizes-lg)"
          title={row.original.enseigne ?? row.original.raison_sociale}
        >
          {row.original.enseigne ?? row.original.raison_sociale ?? "Organisme inconnu"}
        </Link>
        <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
          UAI&nbsp;:{" "}
          {(row.original as any).uai ?? (
            <Text as="span" color="error">
              INCONNUE
            </Text>
          )}{" "}
          - SIRET&nbsp;: {(row.original as any).siret}
        </Text>
      </>
    ),
  },
  {
    accessorKey: "nature",
    sortingFn: (a, b) => {
      // déplace la nature inconnue en premier dans la liste
      const natureA = a.original.nature === "inconnue" ? " " : a.original.nature;
      const natureB = b.original.nature === "inconnue" ? " " : b.original.nature;
      return natureA.localeCompare(natureB);
    },
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
    header: () => (
      <>
        Transmission au tableau
        <Tooltip
          background="bluefrance"
          color="white"
          label={
            <Box padding="1w">
              <b>État de la donnée</b>
              <Text as="p">5 états concernant la donnée sont identifiés&nbsp;:</Text>
              <UnorderedList>
                <ListItem>l’OFA transmet des données depuis moins d’1 semaine (vert)</ListItem>
                <ListItem>l’OFA transmet des données depuis moins de 3 mois (orange)</ListItem>
                <ListItem>l’OFA transmet des données considérées obsolètes (depuis plus de 3 mois - rouge)</ListItem>
                <ListItem>l’OFA ne transmet aucune donnée</ListItem>
                <ListItem>Non-disponible&nbsp;: Les droits d’accès à cette information sont restreints.</ListItem>
              </UnorderedList>
            </Box>
          }
          aria-label="État de la donnée."
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
    sortUndefined: 1,
    cell: ({ row }) => (
      <InfoTransmissionDonnees
        lastTransmissionDate={row.original.last_transmission_date}
        permissionInfoTransmissionEffectifs={row.original.permissions?.infoTransmissionEffectifs}
      />
    ),
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
                Indication de l’état administratif du SIRET de l’établissement, tel qu’il est renseigné sur l’INSEE. Si
                cette information est erronée, merci de leur signaler.
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
                Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille physiquement les
                apprentis et les forme.
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
          {row.original.adresse?.code_insee && row.original.adresse?.code_postal !== row.original.adresse?.code_insee
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
];

interface OrganismesTableProps extends OrganismeFiltersListVisibilityProps {
  organismes: OrganismeNormalized[];
  modeNonFiable?: boolean;
}

function OrganismesTable(props: OrganismesTableProps) {
  const defaultSort: SortingState = [{ desc: false, id: "normalizedName" }];
  const router = useRouter();
  const { trackPlausibleEvent } = usePlausibleTracking();
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
    const query = { ...router.query, search: searchValue ?? undefined, ...convertPaginationInfosToQuery({ sort }) };
    router.replace({ query }, undefined, { shallow: true });
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
      <Box border="1px solid" borderColor="openbluefrance" p={4}>
        <HStack mb="4" spacing="8">
          <InputGroup>
            <Input
              type="text"
              name="search_organisme"
              placeholder="Rechercher un organisme par nom, UAI, SIRET ou ville (indiquez au moins deux caractères)"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              flex="1"
              mr="2"
            />
            <InputRightElement>
              <Button backgroundColor="bluefrance" _hover={{ textDecoration: "none" }}>
                <SearchIcon textColor="white" />
              </Button>
            </InputRightElement>
          </InputGroup>
          <DownloadButton
            variant="secondary"
            w="25%"
            action={() => {
              trackPlausibleEvent(
                props.modeNonFiable ? "telechargement_liste_of_a_fiabiliser" : "telechargement_liste_of_fiables"
              );
              exportDataAsXlsx(
                `tdb-organismes-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
                filteredOrganismes.map((organisme) => convertOrganismeToExport(organisme)),
                organismesExportColumns
              );
            }}
          >
            Télécharger la liste
          </DownloadButton>
        </HStack>
        <Divider mb="4" />
        <HStack>
          <OrganismesFilterPanel {...props} />
        </HStack>
      </Box>

      <Text>
        <strong>{filteredOrganismes.length} organismes</strong>
      </Text>

      <NewTable
        data={filteredOrganismes || []}
        loading={false}
        sortingState={sort}
        onSortingChange={(state) => setSort(state)}
        columns={
          props.modeNonFiable
            ? organismesTableColumnsDefs
            : organismesTableColumnsDefs.filter((column) => column.accessorKey !== "ferme")
        }
      />
    </>
  );
}

export default OrganismesTable;

function isSortingState(value: any): value is SortingState {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && "id" in item && "desc" in item);
}
