import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Container, Heading, HStack, Input, InputGroup, InputRightElement, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AccessorKeyColumnDef, SortingState } from "@tanstack/react-table";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { UAI_INCONNUE_TAG_FORMAT } from "shared";

import { _get, _post } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { AddOrganisme } from "@/components/admin/reseaux/AddOrganisme";
import { RemoveOrganisme } from "@/components/admin/reseaux/RemoveOrganisme";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import NatureOrganismeTag from "@/modules/indicateurs/NatureOrganismeTag";
import NewTable from "@/modules/indicateurs/NewTable";
import { OrganismeNormalized } from "@/modules/organismes/ListeOrganismesPage";

export const getServerSideProps = async (context) => {
  const { id } = context.params;
  const authProps = await getAuthServerSideProps(context);

  return {
    props: {
      ...authProps,
      id,
    },
  };
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
    cell: () => <RemoveOrganisme />,
  },
];

const NetworkPage = ({ id }) => {
  const defaultSort: SortingState = [{ desc: false, id: "normalizedName" }];
  const router = useRouter();
  const [sort, setSort] = useState<SortingState>(defaultSort);

  const { data: reseau } = useQuery<any[], any>(
    ["reseau", "admin", "search"],
    () => _get<any[]>(`/api/v1/admin/reseaux/${id}`),
    {}
  );

  const [reseauxFilter] = useState(id.toUpperCase());

  const q = typeof router.query.q !== "string" ? "" : router.query.q;

  const { data: organismes } = useQuery<Organisme[], any>(
    ["organisme", "admin", "search", q, reseauxFilter],
    ({ signal }) =>
      _get<Organisme[]>(`/api/v1/admin/organismes`, {
        signal,
        params: {
          q,
          limit: 1000,
          filter: {
            reseaux: reseau.nom,
          },
        },
      }),
    { enabled: router.isReady }
  );

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
          <AddOrganisme />
        </HStack>
        <Link href="/admin/reseaux" borderBottom="1px solid" _hover={{ textDecoration: "none" }}>
          <Box as="i" className="ri-arrow-left-line" /> Revenir en arrière
        </Link>
        <Box border="1px solid" borderColor="openbluefrance" p={4} mt={4}>
          <HStack mb="4" spacing="8">
            <InputGroup>
              <Input
                type="text"
                name="search_organisme"
                placeholder="Rechercher un organisme par nom, UAI, SIRET ou ville (indiquez au moins deux caractères)"
                value={""}
                onChange={() => ""}
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
                // exportDataAsXlsx(
                //   `tdb-organismes-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
                //   filteredOrganismes.map((organisme) => convertOrganismeToExport(organisme)),
                //   organismesExportColumns
                // );
              }}
              // isDisabled={filteredOrganismes.length === 0}
              // title={filteredOrganismes.length === 0 ? "Aucun organisme à télécharger" : ""}
            >
              Télécharger la liste
            </DownloadButton>
          </HStack>
        </Box>
        <NewTable
          data={organismes?.data || []}
          loading={false}
          sortingState={sort}
          onSortingChange={(state) => setSort(state)}
          columns={organismesTableColumnsDefs}
        />
      </Container>
    </Page>
  );
};

export default withAuth(NetworkPage, ["ADMINISTRATEUR"]);
