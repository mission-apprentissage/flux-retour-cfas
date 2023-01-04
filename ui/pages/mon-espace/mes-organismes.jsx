import React from "react";
import Head from "next/head";
import {
  Box,
  Center,
  Container,
  Heading,
  Spinner,
  Table,
  TableCaption,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Page } from "../../components";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
import Link from "../../components/Links/Link";
import withAuth from "../../components/withAuth";
import { _get } from "../../common/httpClient";
import { useEspace } from "../../hooks/useEspace";
import { BasePagination } from "../../components/Pagination/Pagination.jsx";
import usePaginatedItems from "../../hooks/old/usePaginatedItems.js";

function useEspaceOrganismes() {
  const {
    data: organismes,
    isLoading,
    isFetching,
  } = useQuery(["espace/organismes"], () => _get(`/api/v1/espace/organismes`), {
    refetchOnWindowFocus: false,
  });

  return { isLoading: isFetching || isLoading, organismes };
}

function MesOrganismes() {
  const title = "Mes Organismes";
  const { isLoading, organismes } = useEspaceOrganismes();

  let { whoIs } = useEspace();

  const [current, setCurrent, itemsSliced] = usePaginatedItems(organismes ?? []);

  const headerTitle = {
    pilot: "Les organismes sur mon territoire",
    erp: "Les organismes connectés de mon erp",
    of: "Mes organismes",
    reseau_of: "Les organismes de mon réseau",
    global: "Tous les organismes",
  };

  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: "Mon espace", to: "/mon-espace/mon-organisme" }, { title: title }]} />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            {headerTitle[whoIs ?? "global"]}
          </Heading>

          {isLoading && !organismes && (
            <Center>
              <Spinner />
            </Center>
          )}

          {!isLoading && organismes && (
            <Table variant="secondary" mt={5} mb={10}>
              <TableCaption>
                <BasePagination
                  current={current}
                  onChange={(page) => {
                    setCurrent(page);
                  }}
                  total={organismes?.length}
                />
              </TableCaption>
              <Thead>
                <Tr background="galt">
                  <Th>Nom de l'organisme</Th>
                  <Th>Nature</Th>
                  <Th>Localisation</Th>
                  <Th>SIRET</Th>
                  <Th>Numéro UAI</Th>
                  <Th>Transmission au tableau de bord</Th>
                  <Th>Consulter</Th>
                </Tr>
              </Thead>
              <Tbody>
                {itemsSliced?.map((organisme) => {
                  return (
                    <Tr key={organisme._id}>
                      <Td color="grey.800">{organisme.nom}</Td>
                      <Td color="grey.800">TODO</Td>
                      <Td color="grey.800">{organisme.adresse?.commune}</Td>
                      <Td color="grey.800">{organisme.siret}</Td>
                      <Td color="grey.800">{organisme.uai}</Td>
                      <Td color="grey.800">
                        {organisme.first_transmission_date ? (
                          <Text color="green">Transmet</Text>
                        ) : (
                          <Text color="tomato">Ne transmet pas</Text>
                        )}
                      </Td>
                      <Td color="grey.800">
                        <Link href={`/mon-espace/organisme/${organisme._id}`} flexGrow={1}>
                          LIEN
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </Container>
      </Box>
    </Page>
  );
}

export default withAuth(MesOrganismes, "page/mes-organismes");
