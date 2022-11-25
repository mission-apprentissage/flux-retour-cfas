import React from "react";
import Head from "next/head";
import { Box, Center, Container, Heading, ListItem, Spinner, Text, UnorderedList } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Page } from "../../components";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

import Link from "../../components/Links/Link";
import withAuth from "../../components/withAuth";
import { _get } from "../../common/httpClient";
import { useEspace } from "../../hooks/useEspace";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

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
            <UnorderedList mt={5}>
              {organismes.map((organisme) => {
                return (
                  <ListItem key={organisme._id} display="flex" w="70%">
                    <Link href={`/mon-espace/organisme/${organisme._id}`} flexGrow={1}>
                      {organisme.nom} [uai: {organisme.uai}]
                    </Link>
                    {!organisme.first_transmission_date && <Text color="tomato">Non connecté</Text>}
                  </ListItem>
                );
              })}
            </UnorderedList>
          )}
        </Container>
      </Box>
    </Page>
  );
}

export default withAuth(MesOrganismes, "page/mes-organismes");
