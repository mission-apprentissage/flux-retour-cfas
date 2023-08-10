import { Box, Heading, Stack, Spinner, Text, VStack, HStack, Button } from "@chakra-ui/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

import { _get, _put } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import Table from "@/components/Table/Table";
import withAuth from "@/components/withAuth";
import useToaster from "@/hooks/useToaster";
import OrganismeDetail, { ExternalLinks } from "@/modules/admin/OrganismeDetail";
import OrganismesList from "@/modules/admin/OrganismesList";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Organisme = () => {
  const title = "Gestion des organismes";
  const router = useRouter();
  const id = router.query.id;
  const {
    data: organisme,
    isLoading,
    refetch,
    error,
  } = useQuery<any, any>(["organisme", id], () => _get(`/api/v1/admin/organismes/${id}`));

  const { mutateAsync: hydrateOrganisme } = useMutation(() => _put(`/api/v1/admin/organismes/${id}/hydrate`));
  const { toastSuccess, toastError } = useToaster();

  async function refreshFormation() {
    const resp = await hydrateOrganisme();
    if (resp._id) {
      toastSuccess("Mise à jour effectuée");
      await refetch();
    } else {
      toastError("Une erreur est survenue");
    }
  }

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Breadcrumb pages={[{ title, path: "/admin/organismes" }, { title: "Fiche organisme" }]} />

      {isLoading ? (
        <Spinner alignSelf="center" />
      ) : error ? (
        <Box>Une erreur est survenue : {error.message}</Box>
      ) : organisme ? (
        <>
          <Stack spacing={10} w="100%">
            <Heading as="h1" mt={6}>
              {organisme.enseigne || organisme.raison_sociale}
            </Heading>
            <Box color="mgalt" fontSize="sm" pb={8}>
              <p>
                Date de création du compte : {new Date(organisme.created_at).toLocaleString()} - il y a{" "}
                {formatDistanceToNow(new Date(organisme.created_at))}
              </p>
              <p>
                Date de dernière maj : {new Date(organisme.updated_at).toLocaleString()} - il y a{" "}
                {formatDistanceToNow(new Date(organisme.updated_at))}
              </p>
            </Box>
            <Box maxWidth="3xl">
              <OrganismeDetail data={organisme} />
            </Box>

            <Box w="100%">
              <HStack justifyContent="space-between">
                <Heading color="grey.800" as="h2" fontSize="beta">
                  Formations
                </Heading>
                <Button onClick={refreshFormation} variant="unstyled">
                  Mettre à jour
                </Button>
              </HStack>

              <Text color="mgalt">
                {organisme?.relatedFormations?.length || 0} Formations dispensées par l&apos;organisme
              </Text>
              <Table
                mt={4}
                data={organisme?.relatedFormations || []}
                columns={{
                  "formation.rncps": {
                    size: 100,
                    header: () => "RNCP(s)",
                    cell: ({ getValue }) => <Text>{(getValue() || []).join(", ")}</Text>,
                  },
                  "formation.cfd": {
                    size: 10,
                    header: () => "CFD",
                    cell: ({ getValue }) => <Text>{getValue()}</Text>,
                  },
                  "formation.libelle": {
                    size: 200,
                    header: () => "Nature",
                    cell: ({ getValue }) => <Text fontSize="1rem">{getValue()}</Text>,
                  },
                }}
              />
            </Box>

            <Box w="100%">
              <Heading color="grey.800" as="h2" fontSize="beta">
                Référentiel
              </Heading>
              <Text color="mgalt">Organismes dans la copie référentiel, avec le même UAI ou SIRET</Text>
              <Table
                mt={4}
                data={organisme?.organismesReferentiel || []}
                columns={{
                  nom: {
                    size: 200,
                    header: () => "Nom de l'organisme",
                    cell: ({ row }) => (
                      <Text fontSize="1rem">
                        {row.original.enseigne || row.original.nom || row.original.raison_sociale}
                      </Text>
                    ),
                  },
                  nature: {
                    size: 100,
                    header: () => "Nature",
                    cell: ({ getValue }) => <Text fontSize="1rem">{getValue()}</Text>,
                  },
                  adresse: {
                    size: 100,
                    header: () => "Localisation",
                    cell: ({ getValue }) => <Text fontSize="1rem">{getValue()?.label}</Text>,
                  },
                  siret: {
                    size: 70,
                    header: () => "SIRET",
                    cell: ({ getValue }) => (
                      <VStack>
                        <Text fontSize="0.9rem" variant={getValue() !== organisme.siret ? undefined : "highlight"}>
                          {getValue() || "SIRET INCONNU"}
                        </Text>
                        {getValue() && getValue() !== organisme.siret && (
                          <ExternalLinks search={getValue()} siret={getValue()} fontSize="xs" />
                        )}
                      </VStack>
                    ),
                  },
                  uai: {
                    size: 60,
                    header: () => "Numéro UAI",
                    cell: ({ getValue }) => (
                      <VStack>
                        <Text fontSize="0.9rem" variant={getValue() !== organisme.uai ? undefined : "highlight"}>
                          {getValue()}
                        </Text>
                        {getValue() && getValue() !== organisme.uai && (
                          <ExternalLinks search={getValue()} fontSize="xs" />
                        )}
                      </VStack>
                    ),
                  },
                  ferme: {
                    size: 60,
                    header: () => "État",
                    cell: ({ getValue }) => {
                      if (getValue()) {
                        return (
                          <Text fontSize="1rem" color="redmarianne" fontWeight="bold">
                            Fermé
                          </Text>
                        );
                      }
                      return <Text fontSize="1rem">Actif</Text>;
                    },
                  },
                }}
              />
            </Box>

            {organisme.organismesDoublon?.length > 0 && (
              <Box w="100%">
                <Heading color="grey.800" as="h2" fontSize="beta">
                  {organisme.organismesDoublon?.length} relations
                </Heading>
                <Text color="mgalt">Organismes avec le même UAI ou SIRET</Text>

                <OrganismesList
                  data={organisme.organismesDoublon}
                  highlight={{ siret: organisme.siret, uai: organisme.uai }}
                />
              </Box>
            )}
          </Stack>
        </>
      ) : (
        <>Utilisateur introuvable :-(</>
      )}
    </Page>
  );
};

export default withAuth(Organisme, ["ADMINISTRATEUR"]);
