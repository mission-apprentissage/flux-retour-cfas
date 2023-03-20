import React from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "@tanstack/react-query";
import Head from "next/head";
import { Box, Heading, Stack, Spinner, Text, VStack, HStack, Button } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import useToaster from "@/hooks/useToaster";

import { _get, _put } from "@/common/httpClient";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { FIABILISATION_LABEL } from "@/common/constants/fiabilisation.js";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import Table from "@/components/Table/Table";
import OrganismesList from "@/modules/admin/OrganismesList";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ExternalLinks = ({ search, siret, ...props }) => (
  <HStack gap={2} {...props}>
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`https://catalogue-apprentissage.intercariforef.org/recherche/etablissements?SEARCH=%22${search}%22`}
    >
      [CAT]
    </a>
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`https://referentiel.apprentissage.onisep.fr/organismes?text=${search}`}
    >
      [REF]
    </a>
    {siret && (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://referentiel.apprentissage.onisep.fr/api/v1/organismes/${siret}`}
      >
        [REF_API]
      </a>
    )}
    {siret && (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${siret}`}
      >
        [ANNU_ENT]
      </a>
    )}
  </HStack>
);

const Organisme = () => {
  const title = "Gestion des organismes";
  const router = useRouter();
  const id = router.query.id;
  const {
    data: organisme,
    isLoading,
    refetch,
    error,
  } = useQuery(["organisme", id], () => _get(`/api/v1/admin/organismes/${id}`));

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
              {organisme.nom || organisme.enseigne}
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
              {Object.entries({
                nom: {
                  header: () => "Nom de l'organisme",
                },
                enseigne: {
                  header: () => "Enseigne",
                },
                nature: {
                  header: () => "Nature",
                },
                adresse: {
                  header: () => "Localisation",
                  cell: ({ value }) => (
                    <>
                      <pre>{value?.complete}</pre>
                    </>
                  ),
                },
                siret: {
                  header: () => "SIRET",
                  cell: ({ value }) => (
                    <HStack gap={4}>
                      <Text bgColor="galtDark" px={2}>
                        {value || "SIRET INCONNU"}
                      </Text>
                      {value && <ExternalLinks search={value} siret={value} />}
                    </HStack>
                  ),
                },
                uai: {
                  header: () => "Numéro UAI",
                  cell: ({ value }) => (
                    <HStack gap={4}>
                      <Text bgColor="galtDark" px={2}>
                        {value || "UAI INCONNU"}
                      </Text>
                      {value && (
                        <HStack gap={2}>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`https://catalogue-apprentissage.intercariforef.org/recherche/etablissements?SEARCH=%22${value}%22`}
                          >
                            [CAT]
                          </a>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`https://referentiel.apprentissage.onisep.fr/organismes?text=${value}`}
                          >
                            [REF]
                          </a>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`https://referentiel.apprentissage.onisep.fr/api/v1/organismes/${value}`}
                          >
                            [REF_API]
                          </a>
                        </HStack>
                      )}
                    </HStack>
                  ),
                },
                ferme: {
                  header: () => "État",
                  cell: ({ value }) => {
                    if (value) {
                      return (
                        <Text color="redmarianne" fontWeight="bold">
                          Fermé
                        </Text>
                      );
                    }
                    return (
                      <Text bgColor="galtDark" px={2}>
                        Actif
                      </Text>
                    );
                  },
                },
                reseaux: {
                  header: () => "Réseau(x)",
                  cell: ({ value }) => (
                    <Text whiteSpace="nowrap" bgColor="galtDark" px={2}>
                      {value.length ? value.join(", ") : ""}
                    </Text>
                  ),
                },
                erps: {
                  header: () => "ERP(s)",
                  cell: ({ value }) => (
                    <Text whiteSpace="nowrap" bgColor="galtDark" px={2}>
                      {value.length ? value.join(", ") : ""}
                    </Text>
                  ),
                },
                fiabilisation_statut: {
                  header: () => "Fiabilisation",
                  cell: ({ value }) => (
                    <Text
                      bgColor="galtDark"
                      px={2}
                      {...(value === "INCONNU" ? { color: "redmarianne", fontWeight: "bold" } : {})}
                    >
                      {FIABILISATION_LABEL[value] || value}
                    </Text>
                  ),
                },
                est_dans_le_referentiel: {
                  header: () => "Est dans le Référentiel?",
                  cell: ({ value }) => (value ? <Text color="green">OUI</Text> : <Text color="tomato">NON</Text>),
                },
                last_transmission_date: {
                  header: () => "Dernière transmission au tdb",
                  cell: ({ value }) =>
                    value ? (
                      <Text color="green">
                        Le {formatDateDayMonthYear(value)} - il y a {formatDistanceToNow(new Date(value))}
                      </Text>
                    ) : (
                      <Text color="tomato">Ne transmet pas</Text>
                    ),
                },
                effectifs_count: {
                  header: () => "Effectifs",
                },
              }).map(([key, { header, cell }]) => (
                <VStack key={key} gap={6} alignItems="baseline">
                  <HStack mb={4} alignItems="baseline">
                    <Box w="300px">{header ? header() : key} </Box>
                    <div>{cell ? cell({ value: organisme[key] }) : organisme[key]}</div>
                  </HStack>
                </VStack>
              ))}
            </Box>

            <Box w="100%">
              <HStack justifyContent="space-between">
                <Heading color="grey.800" as="h2" fontSize="beta">
                  Formations
                </Heading>
                <Button onClick={refreshFormation} variant="unstyled">
                  Metttre à jour
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
