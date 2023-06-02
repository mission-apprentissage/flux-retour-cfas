import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { useRouter } from "next/router";

import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import UserForm from "@/modules/admin/UserForm";
import UsersList from "@/modules/admin/UsersList";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });
const DEFAULT_LIMIT = 100;

const Users = () => {
  const title = "Gestion des utilisateurs";
  const router = useRouter();
  const { page: _page, limit: _limit, q: searchValue, ...filter } = router.query;
  const page = parseInt(router.query.page as string, 10) || 1;
  const limit = parseInt(router.query.limit as string, 10) || DEFAULT_LIMIT;

  const {
    data: users,
    refetch: refetchUsers,
    isLoading,
    error,
  } = useQuery<any, any>(["admin/users", page, limit, filter, searchValue], () =>
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

      <Modal isOpen={!!router.query.new} onClose={closeModal} size="2xl">
        <ModalOverlay />
        <ModalContent borderRadius="0" p={"2w"}>
          <ModalHeader paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
            <Box as="span" verticalAlign="middle">
              Ajouter un nouvel utilisateur
            </Box>
          </ModalHeader>
          <ModalCloseButton width="80px">
            fermer
            <Box paddingLeft="1w" as="i" className="ri-close-line" />
          </ModalCloseButton>
          <UserForm
            user={null}
            onCreate={async (_action, error) => {
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
        {isLoading && !(users as any)?.data ? (
          <Spinner alignSelf="center" />
        ) : error ? (
          <Box>Une erreur est survenue : {(error as any).message}</Box>
        ) : (
          <Stack spacing={2} width="100%">
            <form
              method="get"
              onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const { q } = Object.fromEntries(formData);
                router.push(
                  {
                    pathname: "/admin/users",
                    query: (q ? { q } : {}) as any,
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
            <UsersList data={users?.data || []} pagination={users?.pagination} searchValue={searchValue} />
          </Stack>
        )}
      </VStack>
    </Page>
  );
};

export default withAuth(Users, ["ADMINISTRATEUR"]);
