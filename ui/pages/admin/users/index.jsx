import React from "react";
import { useRouter } from "next/router";
import NavLink from "next/link";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import {
  Box,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Heading,
  HStack,
  Input,
  Stack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import { _get } from "@/common/httpClient";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import ModalClosingButton from "@/components/ModalClosingButton/ModalClosingButton";
import Table from "@/components/Table/Table";
import UserForm from "@/modules/admin/UserForm";
import { ArrowRightLine } from "@/theme/components/icons";
import { getUserOrganisationLabel } from "@/common/constants/usersConstants";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Users = () => {
  const title = "Gestion des utilisateurs";
  const router = useRouter();
  const page = parseInt(router.query.page, 10) || 1;
  const searchValue = router.query.q;
  const {
    data: roles,
    isLoading: isLoadingRoles,
    error: errorsRoles,
  } = useQuery(["roles"], () => _get("/api/v1/admin/roles/"));
  const {
    data: users,
    refetch: refetchUsers,
    isLoading: isLoadingUsers,
    error: errorsUsers,
  } = useQuery(["users", page, searchValue], () => _get("/api/v1/admin/users/", { params: { page, q: searchValue } }));
  // prefetch next page
  useQuery(
    ["users", page + 1, searchValue],
    () => _get("/api/v1/admin/users/", { params: { page: page + 1, q: searchValue } }),
    { enabled: !!(users?.pagination && page + 1 < users?.pagination?.lastPage) }
  );

  const rolesById = roles?.reduce((acc, role) => ({ ...acc, [role._id]: role }), {});
  const isLoading = isLoadingUsers || isLoadingRoles;
  const error = errorsUsers || errorsRoles;

  const closeModal = () => router.push("/admin/users", undefined, { shallow: true });

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Breadcrumb pages={[PAGES.homepage(), { title }]} />

      <Modal isOpen={router.query.new} onClose={closeModal} size="2xl">
        <ModalOverlay />
        <ModalContent borderRadius="0" p={"2w"}>
          <ModalHeader paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
            <Box as="span" verticalAlign="middle">
              Ajouter un nouvel utilisateur
            </Box>
          </ModalHeader>
          <ModalClosingButton />
          <UserForm
            user={null}
            roles={roles}
            afterSubmit={async (result, error) => {
              if (!error) {
                closeModal();
                await refetchUsers();
              }
            }}
          />
        </ModalContent>
      </Modal>

      <VStack alignItems="baseline" width="100%">
        <HStack justifyContent="space-between" alignItems="baseline" width="100%">
          <Heading as="h1" mb={8} mt={6}>
            {title}
          </Heading>
          {!isLoading && (
            <Button as={NavLink} href="?new=1" bg="bluefrance" color="white" _hover={{ bg: "blue.700" }}>
              Créer un utilisateur
            </Button>
          )}
        </HStack>
        {isLoading && !users?.data ? (
          <Spinner alignSelf="center" />
        ) : error ? (
          <Box>Une erreur est survenue : {error.message}</Box>
        ) : (
          <Stack spacing={2} width="100%">
            <form
              method="get"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const { q } = Object.fromEntries(formData);
                router.push(
                  {
                    pathname: "/admin/users",
                    query: q ? { q } : null,
                  },
                  undefined,
                  { shallow: true }
                );
              }}
            >
              <HStack gap={0} width={500}>
                <Input type="search" name="q" defaultValue={searchValue} />
                <Button type="submit" title="Rechercher" m={0} marginInlineStart={0}>
                  <i className="ri-search" />
                  Rechercher
                </Button>
              </HStack>
            </form>
            <Text>
              {users?.pagination?.total} {users?.pagination?.total > 1 ? "comptes utilisateurs" : "compte utilisateur"}
            </Text>
            <Table
              mt={4}
              data={users?.data || []}
              manualPagination={true}
              pagination={users?.pagination}
              onPaginationChange={({ page, limit }) => {
                router.push({ pathname: "/admin/users", query: { page, limit } }, null, { shallow: true });
              }}
              columns={{
                nom: {
                  size: 200,
                  header: () => "Nom",
                },
                prenom: {
                  size: 100,
                  header: () => "Prénom",
                },
                main_organisme: {
                  size: 100,
                  header: () => "Etablissement",
                  cell: ({ getValue }) => (
                    <NavLink href={`/mon-espace/organisme/${getValue()?._id}`} flexGrow={1}>
                      <Text isTruncated maxWidth={400}>
                        {getValue()?.nom}
                      </Text>
                    </NavLink>
                  ),
                },
                organisation: {
                  size: 70,
                  header: () => "Utilisateur",
                  cell: ({ row }) => <Text fontSize="md">{getUserOrganisationLabel(row.original)}</Text>,
                },
                account_status: {
                  size: 70,
                  header: () => "Statut du compte",
                  cell: ({ getValue }) => <Text fontSize="md">{getValue()}</Text>,
                },
                roles: {
                  size: 60,
                  header: () => "Role",
                  cell: ({ getValue, row }) =>
                    getValue().length
                      ? getValue().map((roleId) => rolesById?.[roleId]?.title || roleId)
                      : row.original.is_admin
                      ? "Admin"
                      : "",
                },
                actions: {
                  size: 25,
                  header: () => "",
                  cell: (info) => (
                    <NavLink href={`/admin/users/${info.row.original._id}`} flexGrow={1}>
                      <ArrowRightLine w="1w" />
                    </NavLink>
                  ),
                },
              }}
              searchValue={searchValue}
            />
          </Stack>
        )}
      </VStack>
    </Page>
  );
};

export default withAuth(Users, "admin/page_gestion_utilisateurs");
