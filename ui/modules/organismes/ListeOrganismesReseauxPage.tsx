import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Container, Heading, HStack, Input, InputGroup, InputRightElement, Text } from "@chakra-ui/react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import { IReseau, normalize, UAI_INCONNUE_TAG_FORMAT } from "shared";

import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDate } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { AddOrganisme } from "@/components/admin/reseaux/AddOrganisme";
import { RemoveOrganisme } from "@/components/admin/reseaux/RemoveOrganisme";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import Page from "@/components/Page/Page";
import { useOrganismesFiltered, useOrganismesNormalizedLists } from "@/hooks/organismes";

import NatureOrganismeTag from "../indicateurs/NatureOrganismeTag";
import NewTable from "../indicateurs/NewTable";
import { convertPaginationInfosToQuery } from "../models/pagination";

const organismesTableColumnsDefs = ({
  reseauId,
  refetch,
}: {
  reseauId: string;
  refetch: any;
}): ColumnDef<Organisme & { prominent?: boolean }, any>[] => {
  return [
    {
      header: () => "Nom de l’organisme",
      accessorKey: "normalizedName",
      cell: ({ row }) => (
        <>
          <Link
            href={`/organismes/${row.original?._id}`}
            display="block"
            fontSize="1rem"
            width="var(--chakra-sizes-lg)"
            title={row.original.enseigne ?? row.original.raison_sociale}
          >
            {row.original.enseigne ?? row.original.raison_sociale ?? "Organisme inconnu"}
          </Link>
        </>
      ),
    },
    {
      accessorKey: "UAI",
      cell: ({ row }) => row.original.uai || UAI_INCONNUE_TAG_FORMAT,
    },
    {
      accessorKey: "SIRET",
      cell: ({ row }) => row.original.siret || UAI_INCONNUE_TAG_FORMAT,
    },
    {
      accessorKey: "nature",
      sortingFn: (a, b) => {
        const natureA = a.original.nature === "inconnue" ? " " : a.original.nature;
        const natureB = b.original.nature === "inconnue" ? " " : b.original.nature;
        return natureA.localeCompare(natureB);
      },
      header: () => <>Nature</>,
      cell: ({ getValue }) => <NatureOrganismeTag nature={getValue()} />,
    },
    {
      accessorKey: "adresse",
      sortingFn: (a, b) => {
        const communeA = a.original.adresse?.commune || "";
        const communeB = b.original.adresse?.commune || "";
        return communeA.localeCompare(communeB);
      },
      header: () => <>Localisation</>,
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
      header: () => "Supprimer",
      cell: ({ row }) => {
        return (
          <RemoveOrganisme
            reseauId={reseauId}
            organismeId={row.original._id}
            organismeName={row.original.raison_sociale}
            refetch={refetch}
          />
        );
      },
    },
  ];
};

export type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

interface ListeOrganismesReseauPageProps {
  reseau: IReseau;
  organismes: Organisme[];
  refetch: () => void;
}

function ListeOrganismesReseauPage({ reseau, organismes, refetch }: ListeOrganismesReseauPageProps) {
  const router = useRouter();
  const organismesNormalized = useOrganismesNormalizedLists(organismes);
  const { organismesFiltered } = useOrganismesFiltered(organismesNormalized.allOrganismes);
  const defaultSort: SortingState = [{ desc: false, id: "normalizedName" }];

  const reseauId = reseau?._id?.toString() || "";

  const [searchValue, setSearchValue] = useState<string>(String(router.query.search ?? ""));
  const [sort, setSort] = useState<SortingState>(defaultSort);

  useEffect(() => {
    if (!router.isReady) return;
    const search = router.query.search;
    const sort = router.query.sort;
    if (search && search !== searchValue) setSearchValue(search as string);
    if (sort) {
      setSort(defaultSort);
    }
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) return;
    const query = { ...router.query, search: searchValue ?? undefined, ...convertPaginationInfosToQuery({ sort }) };
    router.replace({ query }, undefined, { shallow: true });
  }, [searchValue, sort, router.isReady]);

  // Simple search: filter organismes by name that contains the search value.
  const filteredOrganismes = useMemo(() => {
    if (searchValue.length < 2) return organismesFiltered;

    const normalizedSearchValue = normalize(searchValue);
    return organismesFiltered?.filter(
      (organisme) =>
        organisme.normalizedName.includes(normalizedSearchValue) ||
        organisme.normalizedUai?.startsWith(normalizedSearchValue) ||
        organisme.siret?.startsWith(normalizedSearchValue) ||
        organisme.normalizedCommune.startsWith(normalizedSearchValue)
    );
  }, [organismesFiltered, searchValue]);

  const title = `Réseau ${reseau?.nom || "inconnu"}`;

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Container maxW="xl">
        <HStack justifyContent="space-between" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            {title}
          </Heading>
          <AddOrganisme reseauId={reseauId} reseauName={reseau?.nom || ""} refetch={refetch} />
        </HStack>
        <Link href="/admin/reseaux" borderBottom="1px solid" _hover={{ textDecoration: "none" }}>
          <Box as="i" className="ri-arrow-left-line" /> Revenir en arrière
        </Link>
        <Box border="1px solid" borderColor="openbluefrance" p={4} mt={4} mb={12}>
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
            {filteredOrganismes && filteredOrganismes.length > 0 && (
              <DownloadButton
                variant="secondary"
                w="25%"
                action={() => {
                  exportDataAsXlsx(
                    `tdb-reseau-${reseau.nom.toLowerCase()}-organismes-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
                    filteredOrganismes.map((organisme) => convertOrganismeToExport(organisme)),
                    organismesExportColumns
                  );
                }}
                isDisabled={filteredOrganismes.length === 0}
                title={filteredOrganismes.length === 0 ? "Aucun organisme à télécharger" : ""}
              >
                Télécharger la liste
              </DownloadButton>
            )}
          </HStack>
        </Box>
        <NewTable
          data={filteredOrganismes || []}
          loading={false}
          sortingState={sort}
          onSortingChange={(state) => setSort(state)}
          columns={organismesTableColumnsDefs({ reseauId: reseauId, refetch })}
        />
      </Container>
    </Page>
  );
}

export default ListeOrganismesReseauPage;
