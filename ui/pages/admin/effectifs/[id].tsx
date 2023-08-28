import { Box, Heading, Stack, Spinner, Text, VStack, HStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import Ribbons from "@/components/Ribbons/Ribbons";
import Table from "@/components/Table/Table";
import withAuth from "@/components/withAuth";
import EffectifsList from "@/modules/admin/EffectifsList";
import InfoDetail from "@/modules/admin/InfoDetail";
import OrganismeDetail, { ExternalLinks } from "@/modules/admin/OrganismeDetail";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Effectif = () => {
  const title = "Gestion des effectifs";
  const router = useRouter();
  const id = router.query.id;
  const {
    data: effectif,
    isLoading,
    error,
  } = useQuery<any, any>(["effectif", id], () => _get(`/api/v1/admin/effectifs/${id}`));

  let formationWarning = "";
  if (!effectif?.formation.formation_id) {
    formationWarning = "Impossible d'avoir le détail de la formation, car la formation de l'apprenant n'a pas d'ID.";
  } else if (!effectif?.formation_detail) {
    formationWarning = `La formation avec l'id ${effectif?.formation.formation_id} n'a pas été trouvée en base.`;
  }

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Breadcrumb pages={[{ title, path: "/admin/effectifs" }, { title: "Fiche effectif" }]} />

      {isLoading ? (
        <Spinner alignSelf="center" />
      ) : error ? (
        <Box>Une erreur est survenue : {error.message}</Box>
      ) : effectif ? (
        <>
          <Stack spacing={10} w="100%">
            <Heading as="h1" mt={6}>
              {effectif.apprenant?.nom} {effectif.apprenant?.prenom}
            </Heading>
            <Box color="mgalt" fontSize="sm" pb={8}>
              <p>
                Date de création du compte : {new Date(effectif.created_at).toLocaleString()} - il y a{" "}
                {formatDistanceToNow(new Date(effectif.created_at))}
              </p>
              <p>
                Date de dernière maj : {new Date(effectif.updated_at).toLocaleString()} - il y a{" "}
                {formatDistanceToNow(new Date(effectif.updated_at))}
              </p>
            </Box>
            <Box maxWidth="3xl">
              <InfoDetail
                title="Informations générales"
                data={effectif}
                rows={{
                  "apprenant.nom": {
                    header: () => "Nom",
                  },
                  "apprenant.prenom": {
                    header: () => "Prénom",
                  },
                  "apprenant.date_de_naissance": {
                    header: () => "Date de naissance",
                    cell: ({ value }) => (
                      <Text>
                        {value && (
                          <>
                            {format(new Date(value), "dd/MM/yyyy")} -{" "}
                            {formatDistanceToNowStrict(new Date(value), { addSuffix: false })}
                          </>
                        )}
                      </Text>
                    ),
                  },
                  "apprenant.courriel": {
                    header: () => "Courriel",
                  },
                  annee_scolaire: {
                    header: () => "Année scolaire",
                  },
                  source: {
                    header: () => "Source",
                  },
                  id_erp_apprenant: {
                    header: () => "ID ERP",
                  },
                }}
              />
            </Box>

            <Box w="100%">
              <HStack justifyContent="space-between">
                <Heading color="grey.800" as="h2" fontSize="beta">
                  Formation
                </Heading>
              </HStack>
              <Text color="mgalt">Formation suivi par l&apos;apprenant</Text>
              {formationWarning && (
                <Ribbons variant="warning" my={5}>
                  {formationWarning}
                </Ribbons>
              )}

              {effectif?.formation_detail && (
                <Box color="mgalt" fontSize="sm" py={4}>
                  <p>
                    Date de création de la formation :{" "}
                    {new Date(effectif?.formation_detail?.created_at).toLocaleString()} - il y a{" "}
                    {formatDistanceToNow(new Date(effectif?.formation_detail?.created_at))}
                  </p>
                  {effectif?.formation_detail?.updated_at && (
                    <p>
                      Date de dernière maj : {new Date(effectif?.formation_detail?.updated_at).toLocaleString()} - il y
                      a {formatDistanceToNow(new Date(effectif?.formation_detail?.updated_at))}
                    </p>
                  )}
                </Box>
              )}
              <InfoDetail
                data={effectif?.formation_detail || effectif?.formation || {}}
                rows={{
                  rncps: {
                    header: () => "RNCP",
                    cell: ({ value, original }) => <Text>{value || original.rncp}</Text>,
                  },
                  cfd: {
                    header: () => "CFD",
                  },
                  cfd_start_date: {
                    header: () => "Début",
                    cell: ({ value }) => <Text>{value ? format(new Date(value), "dd/MM/yyyy") : ""}</Text>,
                  },
                  cfd_end_date: {
                    header: () => "Fin",
                    cell: ({ value }) => <Text>{value ? format(new Date(value), "dd/MM/yyyy") : ""}</Text>,
                  },
                  libelle: {
                    header: () => "Libellé",
                  },
                  niveau: {
                    header: () => "Niveau",
                  },
                  niveau_libelle: {
                    header: () => "Niveau libellé",
                  },
                  metiers: {
                    header: () => "Métiers",
                    cell: ({ value }) => <Text>{value?.map((metier) => <p key={metier}>{metier}</p>)}</Text>,
                  },
                  duree: {
                    header: () => "Durée",
                  },
                  annee: {
                    header: () => "Année",
                  },
                }}
              />
            </Box>

            <Box w="100%">
              <HStack justifyContent="space-between">
                <Heading color="grey.800" as="h2" fontSize="beta">
                  Organisme formateur
                </Heading>
              </HStack>

              <Text color="mgalt">Organisme formateur de l&apos;apprenant</Text>
              {effectif?.organisme && (
                <Box color="mgalt" fontSize="sm" py={4}>
                  <p>
                    Date de création de la formation : {new Date(effectif?.organisme?.created_at).toLocaleString()} - il
                    y a {formatDistanceToNow(new Date(effectif?.organisme?.created_at))}
                  </p>
                  {effectif?.organisme?.updated_at && (
                    <p>
                      Date de dernière maj : {new Date(effectif?.organisme?.updated_at).toLocaleString()} - il y a{" "}
                      {formatDistanceToNow(new Date(effectif?.organisme?.updated_at))}
                    </p>
                  )}
                </Box>
              )}

              <OrganismeDetail data={effectif?.organisme || {}} />
            </Box>

            <Box w="100%">
              <Heading color="grey.800" as="h2" fontSize="beta">
                Queue de traitement
              </Heading>
              <Text color="mgalt">
                {effectif?.effectifsQueue?.length || 0} effectifs dans la queue, avec le même ID ERP Apprenant et source
              </Text>
              <Table
                mt={4}
                data={effectif?.effectifsQueue || []}
                columns={{
                  nom: {
                    size: 200,
                    header: () => "Nom de l'effectif",
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
                        <Text fontSize="0.9rem" variant={getValue() !== effectif.siret ? undefined : "highlight"}>
                          {getValue() || "SIRET INCONNU"}
                        </Text>
                        {getValue() && getValue() !== effectif.siret && (
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
                        <Text fontSize="0.9rem" variant={getValue() !== effectif.uai ? undefined : "highlight"}>
                          {getValue()}
                        </Text>
                        {getValue() && getValue() !== effectif.uai && (
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

            {effectif.effectifsDoublon?.length > 0 && (
              <Box w="100%">
                <Heading color="grey.800" as="h2" fontSize="beta">
                  {effectif.effectifsDoublon?.length} dossier(s) relié(s)
                </Heading>
                <Text color="mgalt">Dossiers avec le même nom et prénom</Text>

                <EffectifsList data={effectif.effectifsDoublon} />
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

export default withAuth(Effectif, ["ADMINISTRATEUR"]);
