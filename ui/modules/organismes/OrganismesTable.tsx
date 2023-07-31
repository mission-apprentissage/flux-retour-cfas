import { DownloadIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, Input, Menu, MenuButton, MenuItem, MenuList, Text, Tooltip } from "@chakra-ui/react";
import { AccessorKeyColumnDef, SortingState } from "@tanstack/react-table";
import { isBefore, subMonths } from "date-fns";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDate, formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { exportDataAsCSV, exportDataAsXlsx } from "@/common/utils/exportUtils";
import { normalize } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import TooltipNatureOrganisme from "@/components/tooltips/TooltipNatureOrganisme";
import NatureOrganismeTag from "@/modules/indicateurs/NatureOrganismeTag";
import NewTable from "@/modules/indicateurs/NewTable";
import { convertPaginationInfosToQuery } from "@/modules/models/pagination";
import { ArrowDropRightLine } from "@/theme/components/icons";

type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

const organismesTableColumnsDefs: AccessorKeyColumnDef<OrganismeNormalized, any>[] = [
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
    header: () => "Transmission au tdb",
    cell: ({ row, getValue }) => {
      if (!row.original.permissions?.infoTransmissionEffectifs) {
        return <Text color="grey">Inconnu</Text>;
      }
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

interface OrganismesTableProps {
  organismes: OrganismeNormalized[];
  modeNonFiable?: boolean;
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
      <HStack>
        <Input
          type="text"
          name="search_organisme"
          placeholder="Rechercher un organisme par nom, UAI, SIRET ou ville (indiquez au moins deux caractères)"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value.trim())}
          flex="1"
          mr="2"
        />
        <Menu>
          <MenuButton
            as={Button}
            variant={"link"}
            fontSize="md"
            mt="2"
            borderBottom="1px"
            borderRadius="0"
            lineHeight="6"
            p="0"
            isDisabled={!props.organismes || filteredOrganismes.length === 0}
            _active={{
              color: "bluefrance",
            }}
            rightIcon={<DownloadIcon />}
          >
            Télécharger la liste
          </MenuButton>

          <MenuList>
            <MenuItem
              onClick={() => {
                exportDataAsXlsx(
                  `tdb-organismes-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
                  filteredOrganismes.map((organisme) => convertOrganismeToExport(organisme)),
                  organismesExportColumns
                );
              }}
            >
              Excel (XLSX)
            </MenuItem>
            <MenuItem
              onClick={() => {
                exportDataAsCSV(
                  `tdb-organismes-${formatDate(new Date(), "dd-MM-yy")}.csv`,
                  filteredOrganismes.map((organisme) => convertOrganismeToExport(organisme)),
                  organismesExportColumns
                );
              }}
            >
              CSV
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      <NewTable
        mt={4}
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

function isMoreThanOrEqualOneMonthAgo(date: Date | string) {
  const oneMonthAgo = subMonths(new Date(), 1);
  const dateAsDate = typeof date === "string" ? new Date(date) : date;
  return isBefore(dateAsDate, oneMonthAgo) || dateAsDate.getTime() === oneMonthAgo.getTime();
}
