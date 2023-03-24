import React from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { Box, Heading, Stack, Spinner } from "@chakra-ui/react";

import { _get } from "@/common/httpClient";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import UserForm from "@/modules/admin/UserForm";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const User = () => {
  const router = useRouter();
  const id = router.query.id;
  const {
    data: user,
    refetch: refetchUser,
    isLoading,
    error,
  } = useQuery(["user", id], () => _get(`/api/v1/admin/users/${id}`));

  const title = "Gestion des utilisateurs";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Breadcrumb pages={[PAGES.homepage(), { title, path: "/admin/users" }, { title: "Fiche Utilisateur" }]} />

      {isLoading ? (
        <Spinner alignSelf="center" />
      ) : error ? (
        <Box>Une erreur est survenue : {error.message}</Box>
      ) : user ? (
        <>
          <Stack spacing={2} maxWidth="3xl">
            <Heading as="h1" mb={8} mt={6}>
              {user.prenom} {user.nom}
            </Heading>
            <Box color="mgalt" fontSize="sm">
              <p>Date de création du compte : {new Date(user.created_at).toLocaleString()}</p>
              <p>Date de dernière connexion : {new Date(user.last_connection).toLocaleString()}</p>
            </Box>
            <UserForm
              user={user}
              afterSubmit={async () => {
                await refetchUser();
              }}
            />
          </Stack>
        </>
      ) : (
        <>Utilisateur introuvable :-(</>
      )}
    </Page>
  );
};

export default withAuth(User, ["ADMINISTRATEUR"]);
