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
import EffectifsList from "@/modules/admin/EffectifsList";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });
const DEFAULT_LIMIT = 100;

const Effectifs = () => {
  const title = "Gestion des effectifs";
  const router = useRouter();
  let { page, limit, sort, q: searchValue, ...filter } = router.query;
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || DEFAULT_LIMIT;
  filter = filter || undefined;

  const {
    data: effectifs,
    isLoading: isLoadingEffectifs,
    error: errorsEffectifs,
  } = useQuery(["admin/effectifs", page, limit, searchValue, sort, filter], () =>
    _get("/api/v1/admin/effectifs/", { params: { page, limit, q: searchValue, sort, filter } })
  );
  // prefetch next page
  useQuery(
    ["effectifs", page + 1, limit, searchValue, sort, filter],
    () => _get("/api/v1/admin/effectifs/", { params: { page: page + 1, limit, q: searchValue, sort, filter } }),
    { enabled: !!(effectifs?.pagination && page + 1 < effectifs?.pagination?.lastPage) }
  );

  const [sortField, sortDirection] = sort?.split(":") || [];
  const sorting = sortField ? [{ id: sortField, desc: sortDirection === "-1" }] : undefined;

  const isLoading = isLoadingEffectifs;
  const error = errorsEffectifs;

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
        {isLoading && !effectifs?.data ? (
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
                    pathname: "/admin/effectifs",
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
              {Intl.NumberFormat().format(effectifs?.pagination?.total || 0)}{" "}
              {effectifs?.pagination?.total > 1 ? "effectifs" : "effectif"}
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

            <EffectifsList
              mt={4}
              data={effectifs?.data || []}
              pagination={effectifs?.pagination}
              sorting={sorting}
              searchValue={searchValue}
            />
          </Stack>
        )}
      </VStack>
    </Page>
  );
};

export default withAuth(Effectifs, "ADMINISTRATEUR");
