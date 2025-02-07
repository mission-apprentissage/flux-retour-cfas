import {
  Box,
  Stack,
  Text,
  Container,
  Heading,
  Center,
  Spinner,
  Code,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { CellContext, type ColumnDef } from "@tanstack/react-table";
import React from "react";
import { UAI_INCONNUE_TAG_FORMAT, type IOrganismeJson } from "shared";
import type {
  IArchivableOrganismeJson,
  IArchivableOrganismesResponseJson,
} from "shared/models/routes/admin/organismes.api";

import { _get, _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { Label } from "@/components/admin/organismes/recherche/Label";
import { UsersList } from "@/components/admin/organismes/recherche/UsersList";
import SimplePage from "@/components/Page/SimplePage";
import Table from "@/components/Table/Table";
import Tag from "@/components/Tag/Tag";
import withAuth from "@/components/withAuth";
import NewTable from "@/modules/indicateurs/NewTable";
import InfoTransmissionDonnees from "@/modules/organismes/InfoTransmissionDonnees";
import { AddFill, SubtractLine } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const organismesTableColumnsDefs: ColumnDef<IArchivableOrganismeJson, any>[] = [
  {
    header: () => "Nom de l’organisme",
    accessorKey: "nom",
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => (
      <Box fontSize="omega" p="2">
        {row.original.nom ?? "Organisme inconnu"}
        <Text fontSize="caption" pt={2} color="#777777" whiteSpace="nowrap">
          UAI&nbsp;:{" "}
          {(row.original as any).uai ?? (
            <Text as="span" color="error">
              {UAI_INCONNUE_TAG_FORMAT}
            </Text>
          )}{" "}
          - SIRET&nbsp;: {row.original.siret}
        </Text>
      </Box>
    ),
  },
  {
    accessorKey: "last_transmission_date",
    header: () => (
      <Text textAlign="center">
        Transmission
        <br />
        (Reception)
      </Text>
    ),
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => (
      <InfoTransmissionDonnees
        lastTransmissionDate={row.original.last_transmission_date}
        permissionInfoTransmissionEffectifs
      />
    ),
  },
  {
    accessorKey: "last_transmission_date",
    header: () => (
      <Text textAlign="center">
        Transmission
        <br />
        (Délagations)
      </Text>
    ),
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => {
      const lastTransmissionDate = row.original.organismes_transmis.map((o) => o.last_transmission_date).toSorted()[0];

      if (!lastTransmissionDate) {
        return <Tag primaryText={"Aucune"} colorScheme="grey_tag" variant={"text"} />;
      }

      return (
        <Tag
          primaryText={`${row.original.organismes_transmis.length} délégations`}
          secondaryText={`MAJ : ${formatDateNumericDayMonthYear(lastTransmissionDate)}`}
          colorScheme="orange_tag"
          variant={"text"}
        />
      );
    },
  },
  {
    accessorKey: "fiabilisation_statut",
    header: () => <>Fiable</>,
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => (
      <Label
        value={row.original.fiabilisation_statut}
        level={row.original.fiabilisation_statut !== "FIABLE" ? "error" : "success"}
      />
    ),
  },
  {
    accessorKey: "nature",
    header: () => <>Nature</>,
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => (
      <Label value={row.original.nature} level={row.original.nature === "inconnue" ? "error" : "info"} />
    ),
  },
  {
    accessorKey: "ferme",
    header: () => <>État</>,
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => (
      <Label value={row.original.ferme ? "Fermé" : "Ouvert"} level={row.original.ferme ? "error" : "success"} />
    ),
  },
  {
    accessorKey: "effectifs_current_year_count",
    header: () => (
      <Text textAlign="center">
        Effectifs
        <br />
        (En cours)
      </Text>
    ),
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => row.original.effectifs_current_year_count ?? 0,
  },
  {
    accessorKey: "effectifs_count",
    header: () => (
      <Text textAlign="center">
        Effectifs
        <br />
        (Total)
      </Text>
    ),
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => row.original.effectifs_count ?? 0,
  },
  {
    accessorKey: "users",
    header: () => <>Utilisateurs</>,
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => {
      return row.original.users.length;
    },
  },
  {
    accessorKey: "organismes_duplicats",
    header: () => <>Duplicats</>,
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => {
      return row.original.organismes_duplicats.length;
    },
  },
  {
    size: 25,
    header: () => " ",
    accessorKey: "action",
    cell: ({ row }: CellContext<IArchivableOrganismeJson, any>) => {
      if (
        row.original.users.length === 0 &&
        row.original.organismes_transmis.length === 0 &&
        row.original.organismes_duplicats.length === 0
      ) {
        return null;
      }

      return row.getCanExpand() ? (
        row.getIsExpanded() ? (
          <SubtractLine fontSize="12px" color="bluefrance" />
        ) : (
          <AddFill fontSize="12px" color="bluefrance" />
        )
      ) : null;
    },
  },
];

const Organisme = () => {
  const title = "Gestion des organismes";

  const result = useQuery(["/api/v1/admin/organismes/archivables"], () =>
    _get<IArchivableOrganismesResponseJson>("/api/v1/admin/organismes/archivables")
  );

  return (
    <SimplePage title={title}>
      <Container maxW="full" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {title}
        </Heading>

        {result.isLoading && (
          <Center h="200px">
            <Spinner />
          </Center>
        )}

        {result.isError && (
          <>
            <Text color="error" my="2">
              {result.error as any}
            </Text>
            <Code whiteSpace="pre">{JSON.stringify(result.error, null, 2)}</Code>
          </>
        )}

        {result.isSuccess && (
          <Stack spacing="4w">
            <Text>
              <strong>{result.data.length} organismes non référencés</strong>
            </Text>

            <Table
              data={result.data}
              loading={false}
              getRowCanExpand={() => true}
              columns={organismesTableColumnsDefs}
              renderSubComponent={({ row }: CellContext<IArchivableOrganismeJson, any>) => {
                return (
                  <Box p="4" ml="4" mt="-1px" mr="-1px" bg="bluegrey.200">
                    <Tabs>
                      <TabList>
                        {row.original.organismes_transmis.length > 0 && <Tab fontWeight="bold">Transmissions</Tab>}
                        {row.original.users.length > 0 && <Tab fontWeight="bold">Utilisateurs</Tab>}
                        {row.original.organismes_duplicats.length > 0 && <Tab fontWeight="bold">Duplicats</Tab>}
                      </TabList>
                      <TabPanels>
                        {row.original.organismes_transmis.length > 0 && (
                          <TabPanel>
                            <NewTable
                              data={row.original.organismes_transmis}
                              columns={[
                                {
                                  size: 500,
                                  header: "Nom",
                                  accessorKey: "nom",
                                  cell: ({ row }) => (
                                    <Text fontSize="zeta" p="2">
                                      {row.original.nom ?? "Organisme inconnu"}
                                      {" ("}
                                      {row.original.uai ?? "UAI INCONNUE"}
                                      {" / "}
                                      {row.original.siret}
                                      {")"}
                                    </Text>
                                  ),
                                },
                                {
                                  header: "Transmission",
                                  accessorKey: "date",
                                  cell: ({ row }) => (
                                    <InfoTransmissionDonnees
                                      lastTransmissionDate={row.original.last_transmission_date}
                                      permissionInfoTransmissionEffectifs
                                    />
                                  ),
                                },
                                {
                                  accessorKey: "fiabilisation_statut",
                                  header: () => <>Fiable</>,
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) => (
                                    <Label
                                      value={row.original.fiabilisation_statut}
                                      level={row.original.fiabilisation_statut !== "FIABLE" ? "error" : "success"}
                                    />
                                  ),
                                },
                                {
                                  accessorKey: "ferme",
                                  header: () => <>État</>,
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) => (
                                    <Label
                                      value={row.original.ferme ? "Fermé" : "Ouvert"}
                                      level={row.original.ferme ? "error" : "success"}
                                    />
                                  ),
                                },
                                {
                                  accessorKey: "effectifs_current_year_count",
                                  header: () => (
                                    <Text textAlign="center">
                                      Effectifs
                                      <br />
                                      (En cours)
                                    </Text>
                                  ),
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) =>
                                    row.original.effectifs_current_year_count ?? 0,
                                },
                                {
                                  accessorKey: "effectifs_count",
                                  header: () => (
                                    <Text textAlign="center">
                                      Effectifs
                                      <br />
                                      (Total)
                                    </Text>
                                  ),
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) =>
                                    row.original.effectifs_count ?? 0,
                                },
                              ]}
                            />
                          </TabPanel>
                        )}
                        {row.original.users.length > 0 && (
                          <TabPanel>
                            <UsersList users={row.original.users} />
                          </TabPanel>
                        )}
                        {row.original.organismes_duplicats.length > 0 && (
                          <TabPanel>
                            <NewTable
                              data={row.original.organismes_duplicats}
                              columns={[
                                {
                                  size: 500,
                                  header: "Nom",
                                  accessorKey: "nom",
                                  cell: ({ row }) => (
                                    <Text fontSize="zeta" p="2">
                                      {row.original.nom ?? "Organisme inconnu"}
                                      {" ("}
                                      {row.original.uai ?? "UAI INCONNUE"}
                                      {" / "}
                                      {row.original.siret}
                                      {")"}
                                    </Text>
                                  ),
                                },
                                {
                                  header: "Transmission",
                                  accessorKey: "date",
                                  cell: ({ row }) => (
                                    <InfoTransmissionDonnees
                                      lastTransmissionDate={row.original.last_transmission_date}
                                      permissionInfoTransmissionEffectifs
                                    />
                                  ),
                                },
                                {
                                  accessorKey: "est_dans_le_referentiel",
                                  header: () => <>Référentiel</>,
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) => (
                                    <Label
                                      value={row.original.est_dans_le_referentiel}
                                      level={row.original.est_dans_le_referentiel !== "present" ? "error" : "success"}
                                    />
                                  ),
                                },
                                {
                                  accessorKey: "nature",
                                  header: () => <>Nature</>,
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) => (
                                    <Label
                                      value={row.original.nature}
                                      level={row.original.nature === "inconnue" ? "error" : "info"}
                                    />
                                  ),
                                },
                                {
                                  accessorKey: "fiabilisation_statut",
                                  header: () => <>Fiable</>,
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) => (
                                    <Label
                                      value={row.original.fiabilisation_statut}
                                      level={row.original.fiabilisation_statut !== "FIABLE" ? "error" : "success"}
                                    />
                                  ),
                                },
                                {
                                  accessorKey: "ferme",
                                  header: () => <>État</>,
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) => (
                                    <Label
                                      value={row.original.ferme ? "Fermé" : "Ouvert"}
                                      level={row.original.ferme ? "error" : "success"}
                                    />
                                  ),
                                },
                                {
                                  accessorKey: "effectifs_current_year_count",
                                  header: () => (
                                    <Text textAlign="center">
                                      Effectifs
                                      <br />
                                      (En cours)
                                    </Text>
                                  ),
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) =>
                                    row.original.effectifs_current_year_count ?? 0,
                                },
                                {
                                  accessorKey: "effectifs_count",
                                  header: () => (
                                    <Text textAlign="center">
                                      Effectifs
                                      <br />
                                      (Total)
                                    </Text>
                                  ),
                                  cell: ({ row }: CellContext<IOrganismeJson, any>) =>
                                    row.original.effectifs_count ?? 0,
                                },
                              ]}
                            />
                          </TabPanel>
                        )}
                      </TabPanels>
                    </Tabs>
                  </Box>
                );
              }}
            />
          </Stack>
        )}
      </Container>
    </SimplePage>
  );
};

export default withAuth(Organisme, ["ADMINISTRATEUR"]);
