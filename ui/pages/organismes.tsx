import React, { useState } from "react";
import Head from "next/head";
import { Box, Center, Container, Heading, Spinner, Text } from "@chakra-ui/react";

import { ArrowDropRightLine } from "@/theme/components/icons";
import { FIABILISATION_LABEL } from "@/common/constants/fiabilisation.js";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import Page from "@/components/Page/Page";
import Link from "@/components/Links/Link";
import Table from "@/components/Table/Table";
import withAuth from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import { useOrganisationOrganismes } from "@/hooks/organismes";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils.js";
import { OrganisationType } from "@/common/internal/Organisation";

const natures = {
  responsable: "Responsable",
  formateur: "Formateur",
  responsable_formateur: "Responsable Formateur",
  lieu_formation: "Lieu de formation",
  inconnue: "Inconnue",
};

function getHeaderTitleFromOrganisationType(type: OrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
      return "Mes organismes formateurs";

    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";

    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type '${type}' inconnu`);
  }
}

function MesOrganismes() {
  const title = "Mes organismes";
  const { organisationType } = useAuth();
  const { isLoading, organismes } = useOrganisationOrganismes();
  const [searchValue, setSearchValue] = useState("");

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Heading textStyle="h2" color="grey.800" mb={5}>
            {getHeaderTitleFromOrganisationType(organisationType)}
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
                  value: searchValue,
                  onSubmit: (value: string) => setSearchValue(value.trim()),
                }}
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
                        <Link href={`/organismes/${organismes[row.id]._id}`} flexGrow={1}>
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

export default withAuth(MesOrganismes);
