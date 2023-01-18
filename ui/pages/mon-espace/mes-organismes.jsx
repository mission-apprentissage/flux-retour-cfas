import React, { useState } from "react";
import Head from "next/head";
import { Box, Center, Container, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Page } from "../../components";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
import Link from "../../components/Links/Link";
import withAuth from "../../components/withAuth";
import { _get } from "../../common/httpClient";
import { useEspace } from "../../hooks/useEspace";
import Table from "../../components/Table/Table";
import { ArrowDropRightLine } from "../../theme/components/icons";
import { Input } from "../../modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";

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

  const [searchValue, setSearchValue] = useState("");

  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 4, 4]} mb={16}>
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
            <>
              <Input
                {...{
                  name: `search_organisme`,
                  fieldType: "text",
                  mask: "C",
                  maskBlocks: [
                    {
                      name: "C",
                      mask: "Pattern",
                      pattern: "^.*$",
                    },
                  ],
                  placeholder: "Rechercher un organisme",
                }}
                onSubmit={(value) => setSearchValue(value.trim())}
                value={searchValue}
              />
              <Table
                mt={4}
                data={organismes}
                columns={{
                  nom: {
                    size: 200,
                    header: () => {
                      return <Box textAlign="left">Nom de l&rsquo;organisme</Box>;
                    },
                    cell: ({ row }) => {
                      const { nomOrga } = organismes[row.id];
                      return <Text fontSize="1rem">{nomOrga}</Text>;
                    },
                  },
                  nature: {
                    size: 100,
                    header: () => {
                      return <Box textAlign="left">Nature</Box>;
                    },
                    cell: ({ row }) => {
                      const { nature } = organismes[row.id];
                      const natures = {
                        responsable: "Responsable",
                        formateur: "Formateur",
                        responsable_formateur: "Responsable Formateur",
                        lieu_formation: "Lieu de formation",
                        inconnue: "Inconnue",
                      };
                      return <Text fontSize="1rem">{natures[nature] ?? "Inconnue"}</Text>;
                    },
                  },
                  localisation: {
                    size: 100,
                    header: () => {
                      return <Box textAlign="left">Localisation</Box>;
                    },
                    cell: ({ row }) => {
                      const { adresse } = organismes[row.id];
                      return <Text fontSize="1rem">{adresse?.commune}</Text>;
                    },
                  },
                  siret: {
                    size: 70,
                    header: () => {
                      return <Box textAlign="left">SIRET</Box>;
                    },
                    cell: ({ row }) => {
                      const { sirets } = organismes[row.id];

                      return (
                        <VStack alignItems="flex-start">
                          {sirets.map((siret) => (
                            <Text key={siret}>{siret}</Text>
                          ))}
                        </VStack>
                      );
                    },
                  },
                  uai: {
                    size: 60,
                    header: () => {
                      return <Box textAlign="left">Numéro UAI</Box>;
                    },
                    cell: ({ row }) => {
                      const { uai } = organismes[row.id];
                      return <Text fontSize="1rem">{uai}</Text>;
                    },
                  },
                  state: {
                    size: 60,
                    header: () => {
                      return <Box textAlign="left">État</Box>;
                    },
                    cell: ({ row }) => {
                      const { ferme } = organismes[row.id];
                      if (ferme) {
                        return (
                          <Text fontSize="1rem" color="redmarianne" fontWeight="bold">
                            Fermé
                          </Text>
                        );
                      }
                      return <Text fontSize="1rem">Actif</Text>;
                    },
                  },
                  transmission: {
                    size: 120,
                    header: () => {
                      return <Box textAlign="left">Transmission au tableau de bord</Box>;
                    },
                    cell: ({ row }) => {
                      const { first_transmission_date } = organismes[row.id];
                      return first_transmission_date ? (
                        <Text color="green">Transmet</Text>
                      ) : (
                        <Text color="tomato">Ne transmet pas</Text>
                      );
                    },
                  },
                  goTo: {
                    size: 25,
                    header: () => {
                      return <Box>&nbsp;</Box>;
                    },
                    cell: ({ row }) => {
                      return (
                        <Link href={`/mon-espace/organisme/${organismes[row.id]._id}`} flexGrow={1}>
                          <ArrowDropRightLine />
                        </Link>
                      );
                    },
                  },
                }}
                searchValue={searchValue}
              />
            </>
          )}
        </Container>
      </Box>
    </Page>
  );
}

export default withAuth(MesOrganismes, "page/mes-organismes");
