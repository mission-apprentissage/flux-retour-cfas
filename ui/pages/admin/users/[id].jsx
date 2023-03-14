import React from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { Box, Flex, Heading, Stack, Spinner, Text, VStack } from "@chakra-ui/react";

import { _get } from "@/common/httpClient";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import UserForm from "@/modules/admin/UserForm";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Users = () => {
  const router = useRouter();
  const id = router.query.id;
  const {
    data: roles,
    isLoading: isLoadingRoles,
    error: errorsRoles,
  } = useQuery(["roles"], () => _get("/api/v1/admin/roles/"));
  const {
    data: user,
    refetch: refetchUser,
    isLoading: isLoadingUsers,
    error: errorsUsers,
  } = useQuery(["user", id], () => _get(`/api/v1/admin/users/${id}`));

  const title = "Gestion des utilisateurs";
  const pendingPermissionsCount = user?.permissions?.filter((p) => p.pending).length;
  const isLoading = isLoadingRoles || isLoadingUsers;
  const error = errorsUsers || errorsRoles;

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
            <Flex fontSize="gamma" flexGrow={1} justifyContent="space-between" alignItems="center">
              <VStack alignItems="flex-end" spacing={0}>
                {pendingPermissionsCount > 0 && (
                  <Text fontSize={"sm"}>{pendingPermissionsCount} permission(s) en attente de validation</Text>
                )}
              </VStack>
            </Flex>
            <UserForm
              user={user}
              roles={roles}
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

export default withAuth(Users, "admin/page_gestion_utilisateurs");
