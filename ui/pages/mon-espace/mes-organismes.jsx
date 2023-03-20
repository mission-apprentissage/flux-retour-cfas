import React, { useState } from "react";
import Head from "next/head";
import { Box, Center, Container, Heading, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { ArrowDropRightLine } from "@/theme/components/icons";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import { FIABILISATION_LABEL } from "@/common/constants/fiabilisation.js";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import Page from "@/components/Page/Page";
import { useEspace } from "@/hooks/useEspace";
import Link from "@/components/Links/Link";
import Table from "@/components/Table/Table";
import withAuth from "@/components/withAuth";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils.js";

const natures = {
  responsable: "Responsable",
  formateur: "Formateur",
  responsable_formateur: "Responsable Formateur",
  lieu_formation: "Lieu de formation",
  inconnue: "Inconnue",
};

const headerTitle = {
  pilot: "Les organismes sur mon territoire",
  erp: "Les organismes connectés de mon erp",
  of: "Mes organismes",
  reseau_of: "Les organismes de mon réseau",
  global: "Tous les organismes",
};

function useEspaceOrganismes() {
  const {
    data: organismes,
    isLoading,
    isFetching,
  } = useQuery(["espace/organismes"], () => _get("/api/v1/espace/organismes"));

  return { isLoading: isFetching || isLoading, organismes };
}

function MesOrganismes() {
  const title = "Mes organismes";
  const { isLoading, organismes } = useEspaceOrganismes();

  const { whoIs } = useEspace();

  const [searchValue, setSearchValue] = useState("");

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 4, 4]} mb={16}>
        <Container maxW="xl">
          <Breadcrumb pages={[PAGES.monEspace(), { title }]} />
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
                    header: () => "Nom de l'organisme",
                    cell: ({ row }) => <Text fontSize="1rem">{row.original.nomOrga ?? row.original.nom}</Text>,
                  },
                  nature: {
                    size: 100,
                    header: () => "Nature",
                    cell: ({ getValue }) => <Text fontSize="1rem">{natures[getValue()] ?? "Inconnue"}</Text>,
                  },
                  adresse: {
                    size: 100,
                    header: () => "Localisation",
                    cell: ({ getValue }) => <Text fontSize="1rem">{getValue()?.commune}</Text>,
                  },
                  siret: {
                    size: 70,
                    header: () => "SIRET",
                    cell: ({ getValue }) => getValue() || "SIRET INCONNU",
                  },
                  uai: {
                    size: 60,
                    header: () => "Numéro UAI",
                    cell: ({ getValue }) => <Text fontSize="1rem">{getValue()}</Text>,
                  },
                  ferme: {
                    size: 60,
                    header: () => "État",
                    cell: ({ getValue }) =>
                      getValue() ? (
                        <Text fontSize="1rem" color="redmarianne" fontWeight="bold">
                          Fermé
                        </Text>
                      ) : (
                        <Text fontSize="1rem">Actif</Text>
                      ),
                  },
                  fiabilisation_statut: {
                    size: 120,
                    header: () => "Fiabilisation",
                    cell: ({ getValue }) => (
                      <Text>{FIABILISATION_LABEL[getValue()] || FIABILISATION_LABEL.INCONNUE}</Text>
                    ),
                  },
                  last_transmission_date: {
                    size: 120,
                    header: () => "Dernière transmission au tdb",
                    cell: ({ getValue }) =>
                      getValue() ? (
                        <Text color="green">Le {formatDateDayMonthYear(getValue())}</Text>
                      ) : (
                        <Text color="tomato">Ne transmet pas</Text>
                      ),
                  },
                  goTo: {
                    size: 25,
                    header: () => " ",
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
