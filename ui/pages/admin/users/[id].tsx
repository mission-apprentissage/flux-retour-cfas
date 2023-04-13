import React from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { Box, Heading, Stack, Spinner } from "@chakra-ui/react";

import { _get } from "@/common/httpClient";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import UserForm from "@/modules/admin/UserForm";
import Ribbons from "@/components/Ribbons/Ribbons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const User = () => {
  const router = useRouter();
  const id = router.query.id;
  const {
    data,
    refetch: refetchUser,
    isLoading,
    error,
  } = useQuery(["user", id], () => _get(`/api/v1/admin/users/${id}`));

  const title = "Gestion des utilisateurs";
  const { user, warning } = data || {};
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Breadcrumb pages={[{ title, path: "/admin/users" }, { title: "Fiche Utilisateur" }]} />

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
              <p>
                Date de dernière connexion :{" "}
                {user.last_connection ? new Date(user.last_connection).toLocaleString() : "jamais connecté"}
              </p>
            </Box>
            {warning && (
              <Ribbons variant="warning" mt={5}>
                <Box pl={3}>{warning}</Box>
              </Ribbons>
            )}
            <UserForm user={user} onDelete={() => router.push("/admin/users")} onUpdate={() => refetchUser()} />
          </Stack>
        </>
      ) : (
        <>Utilisateur introuvable :-(</>
      )}
    </Page>
  );
};

export default withAuth(User, ["ADMINISTRATEUR"]);
