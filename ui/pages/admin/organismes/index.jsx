import React from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { Box, Button, Heading, HStack, Input, Stack, Spinner, Text, VStack } from "@chakra-ui/react";

import { _get } from "@/common/httpClient";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import OrganismesList from "@/modules/admin/OrganismesList";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Organismes = () => {
  const title = "Gestion des organismes";
  const router = useRouter();
  let { page, limit, sort, q: searchValue, ...filter } = router.query;
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  filter = filter || undefined;

  const {
    data: organismes,
    isLoading: isLoadingOrganismes,
    error: errorsOrganismes,
  } = useQuery(["admin/organismes", page, limit, searchValue, sort, filter], () =>
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

      <Breadcrumb pages={[PAGES.homepage(), { title }]} />

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
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const { q } = Object.fromEntries(formData);
                router.push(
                  {
                    pathname: "/admin/organismes",
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
            <Text fontSize="1rem">
              {organismes?.pagination?.total} {organismes?.pagination?.total > 1 ? "organismes" : "organisme"}
            </Text>
            <OrganismesList
              mt={4}
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

export default withAuth(Organismes, "admin/page_gestion_organismes");
