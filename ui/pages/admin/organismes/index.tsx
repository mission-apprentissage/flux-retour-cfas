import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { Box, Button, Heading, HStack, Input, Stack, Spinner, Text, VStack, CloseButton } from "@chakra-ui/react";

import { _get } from "@/common/httpClient";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import OrganismesList from "@/modules/admin/OrganismesList";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });
const DEFAULT_LIMIT = 100;

const Organismes = () => {
  const title = "Gestion des organismes";
  const router = useRouter();
  let { q: searchValue, ...filter } = router.query;
  const sort = router.query.sort as string;
  const page = parseInt(router.query.page as string, 10) || 1;
  const limit = parseInt(router.query.limit as string, 10) || DEFAULT_LIMIT;
  filter = filter || undefined;

  const {
    data: organismes,
    isLoading: isLoadingOrganismes,
    error: errorsOrganismes,
  } = useQuery<any, any>(["admin/organismes", page, limit, searchValue, sort, filter], () =>
    _get("/api/v1/admin/organismes/", { params: { page, limit, q: searchValue, sort, filter } })
  );
  // prefetch next page
  useQuery(
    ["organismes", page + 1, limit, searchValue, sort, filter],
    () => _get("/api/v1/admin/organismes/", { params: { page: page + 1, limit, q: searchValue, sort, filter } }),
    { enabled: !!(organismes?.pagination && page + 1 < organismes?.pagination?.lastPage) }
  );

  const [sortField, sortDirection] = sort?.split(":") || [];
  const sorting = sortField ? [{ id: sortField, desc: sortDirection === "-1" }] : undefined;

  const isLoading = isLoadingOrganismes;
  const error = errorsOrganismes;

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <VStack alignItems="baseline" width="100%">
        <HStack justifyContent="space-between" alignItems="baseline" width="100%">
          <Heading as="h1" mb={8} mt={6}>
            {title}
          </Heading>
        </HStack>
        {isLoading && !organismes?.data ? (
          <Spinner alignSelf="center" />
        ) : error ? (
          <Box>Une erreur est survenue : {error.message}</Box>
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
                    pathname: "/admin/organismes",
                    query: (q ? { q } : null) as any,
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

            <Text fontSize="1rem">
              {Intl.NumberFormat().format(organismes?.pagination?.total || 0)}{" "}
              {organismes?.pagination?.total > 1 ? "organismes" : "organisme"}
            </Text>

            {Object.entries(filter).length > 0 && (
              <HStack alignItems="baseline" width="100%">
                <Text>Filtres :</Text>
                {Object.entries(filter).map(([key, value]) => {
                  // eslint-disable-next-line no-unused-vars
                  const { [key]: _val, ...query } = router.query;
                  return (
                    <HStack
                      as={Link}
                      key={key}
                      href={{ query }}
                      px={2}
                      color="white"
                      backgroundColor="bluefrance"
                      height="30px"
                      borderRadius="40px"
                      fontSize="zeta"
                    >
                      <Text>
                        {key}: {value}
                      </Text>
                      <CloseButton />
                    </HStack>
                  );
                })}
              </HStack>
            )}

            <OrganismesList
              data={organismes?.data || []}
              pagination={organismes?.pagination}
              sorting={sorting}
              searchValue={searchValue}
            />
          </Stack>
        )}
      </VStack>
    </Page>
  );
};

export default withAuth(Organismes, ["ADMINISTRATEUR"]);
