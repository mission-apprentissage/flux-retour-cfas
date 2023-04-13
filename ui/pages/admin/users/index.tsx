import React from "react";
import { useRouter } from "next/router";
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
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import ModalClosingButton from "@/components/ModalClosingButton/ModalClosingButton";
import UserForm from "@/modules/admin/UserForm";
import UsersList from "@/modules/admin/UsersList";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });
const DEFAULT_LIMIT = 100;

const Users = () => {
  const title = "Gestion des utilisateurs";
  const router = useRouter();
  let { page, limit, q: searchValue, ...filter } = router.query;
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || DEFAULT_LIMIT;

  const {
    data: users,
    refetch: refetchUsers,
    isLoading,
    error,
  } = useQuery(["admin/users", page, limit, filter, searchValue], () =>
    _get("/api/v1/admin/users/", { params: { page, q: searchValue, filter } })
  );
  // prefetch next page
  useQuery(
    ["users", page + 1, limit, filter, searchValue],
    () => _get("/api/v1/admin/users/", { params: { page: page + 1, limit, q: searchValue, filter } }),
    { enabled: !!(users?.pagination && page + 1 < users?.pagination?.lastPage) }
  );

  const closeModal = () => router.push("/admin/users", undefined, { shallow: true });

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

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
            afterSubmit={async (_action, error) => {
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
          {/** désactivé tant que formulaire de création pas complet */}
          {/* {!isLoading && (
            <Button as={NavLink} href="?new=1" bg="bluefrance" color="white" _hover={{ bg: "blue.700" }}>
              Créer un utilisateur
            </Button>
          )} */}
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
              {Intl.NumberFormat().format(users?.pagination?.total || 0)}{" "}
              {users?.pagination?.total > 1 ? "comptes utilisateurs" : "compte utilisateur"}
            </Text>
            <UsersList mt={4} data={users?.data || []} pagination={users?.pagination} searchValue={searchValue} />
          </Stack>
        )}
      </VStack>
    </Page>
  );
};

export default withAuth(Users, ["ADMINISTRATEUR"]);
