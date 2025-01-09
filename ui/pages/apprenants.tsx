import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Container, Heading, HStack, VStack, Text, Link, Flex } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getAnneeScolaireFromDate } from "shared";

import { _get } from "@/common/httpClient";
import Accordion from "@/components/Accordion/Accordion";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import ApprenantsTable from "@/modules/mon-espace/apprenants/apprenantsTable/ApprenantsTable";

function EffectifsPage() {
  const router = useRouter();

  const [pagination, setPagination] = useState({ page: 0, limit: 20 });
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string[]>>({
    annee_scolaire: [getAnneeScolaireFromDate(new Date())],
  });
  const [sort, setSort] = useState<SortingState>([{ desc: true, id: "annee_scolaire" }]);

  useEffect(() => {
    const parseFilter = (key: string, value: string | string[] | undefined) => {
      if (value) {
        const values = Array.isArray(value) ? value : [value];
        try {
          return values.map((v) => {
            const decodedValue = decodeURIComponent(v);
            return decodedValue.startsWith("[") && decodedValue.endsWith("]")
              ? JSON.parse(decodedValue)
              : [decodedValue];
          });
        } catch {
          return values.map((v) => decodeURIComponent(v));
        }
      }
      return undefined;
    };

    const mergedFilters: Record<string, string[]> = { ...filters };

    const filterKeys = ["formation", "statut_courant", "annee_scolaire", "source"];

    filterKeys.forEach((key) => {
      const parsedFilter = parseFilter(key, router.query[key]);
      if (parsedFilter) {
        mergedFilters[key] = parsedFilter.flat();
      }
    });

    if (JSON.stringify(mergedFilters) !== JSON.stringify(filters)) {
      setFilters(mergedFilters);
    }
  }, [router.query]);

  const {
    data: apprenants,
    isFetching,
    refetch,
  } = useQuery(
    ["apprenants", pagination],
    async () => {
      const response = await _get(`/api/v1/organisation/mission-locale/effectifs`, {
        params: {
          // pageIndex: pagination.pageIndex,
          // pageSize: pagination.pageSize,
          // search,
          // sortField: sort[0]?.id,
          // sortOrder: sort[0]?.desc ? "desc" : "asc",
          // ...filters,
        },
      });

      const transformedData = response.data.map((item) => ({
        ...item,
        id: item._id,
        _id: undefined,
      }));

      return {
        ...response,
        data: transformedData,
      };
    },
    { keepPreviousData: true }
  );

  console.log("CONSOLE LOG ~ EffectifsPage ~ apprenants:", apprenants);
  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);

    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          pageIndex: newPagination.pageIndex,
          pageSize: newPagination.pageSize,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);

    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, search: value },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    setPagination({ ...pagination, page: 0 });
    const mergedFilters = { ...filters };

    Object.entries(newFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        mergedFilters[key] = values;
      } else {
        delete mergedFilters[key];
      }
    });

    const queryFilters = Object.entries(mergedFilters).reduce(
      (acc, [key, values]) => {
        acc[key] = JSON.stringify(values);
        return acc;
      },
      {} as Record<string, string>
    );

    const updatedQuery = { ...router.query, ...queryFilters };
    Object.keys(router.query).forEach((key) => {
      if (!queryFilters[key]) {
        delete updatedQuery[key];
      }
    });

    setFilters(mergedFilters);

    router.push(
      {
        pathname: router.pathname,
        query: updatedQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleSortChange = (newSort: SortingState) => {
    setPagination({ ...pagination, page: 0 });
    setSort(newSort);

    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          sortField: newSort[0]?.id,
          sortOrder: newSort[0]?.desc ? "desc" : "asc",
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");

    const { organismeId } = router.query;

    const updatedQuery = organismeId ? { organismeId } : {};
    router.push(
      {
        pathname: router.pathname,
        query: updatedQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <SimplePage title="Apprenants">
      <Container maxW="xl" p="8">
        <HStack justifyContent="space-between" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Apprenants
          </Heading>
        </HStack>
        <VStack spacing={4} alignItems="flex-start" w={2 / 3}>
          <Text>
            Retrouvez ci-dessous les <strong>{apprenants?.pagination.total}</strong> jeunes (sans contrat, en rupture de
            contrat ou en rupture sèche) et leurs coordonnées, identifiés comme ayant besoin d’un accompagnement par la
            Mission locale.Cliquez sur chaque jeune pour plus d’informations sur son parcours.
          </Text>
          <Text>Sources : CFA et DECA</Text>
          <Ribbons variant="alert">
            <Flex direction="column" ml={3} gap={2} justifyContent="flexstart">
              <Text color="grey.800">
                Nous vous mettons à disposition les contacts des jeunes et leur CFA : vous êtes encouragé à les
                contacter. Ne partagez pas ces listes.
              </Text>
              <Link
                href="/apprenants"
                color="action-high-blue-france"
                borderBottom="1px"
                w="fit-content"
                display="flex"
                alignItems="center"
              >
                Lire la charte
                <ArrowForwardIcon />
              </Link>
            </Flex>
          </Ribbons>
        </VStack>

        <Box mt={10} mb={16}>
          <ApprenantsTable
            apprenants={apprenants?.data || []}
            filters={filters}
            pagination={pagination}
            search={search}
            sort={sort}
            onPaginationChange={handlePaginationChange}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            total={0}
            availableFilters={{}}
            resetFilters={resetFilters}
            isFetching={isFetching}
            refetch={refetch}
          />
        </Box>
        <Flex gap={12} mt={16} mb={6}>
          <Box flex="3">
            <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
              Informations sur les données exposées ci-dessus
            </Heading>

            <Accordion defaultIndex={undefined} useCustomIcons={true} w={2 / 3}>
              <Accordion.Item title="Qu’est-il attendu des Missions Locales concernant cette mise à disposition des listes ?">
                <Text>
                  L’accès à cette liste est strictement personnelle et ne peut en aucun cas être partagée.Un compte
                  utilisateur unique et nominatif doit être créé sur le Tableau de bord de l’apprentissage pour accéder
                  aux données.
                </Text>
              </Accordion.Item>
              <Accordion.Item title="D’où viennent les données exposées ci-dessus ?">
                <Text>
                  L’accès à cette liste est strictement personnelle et ne peut en aucun cas être partagée.Un compte
                  utilisateur unique et nominatif doit être créé sur le Tableau de bord de l’apprentissage pour accéder
                  aux données.
                </Text>
              </Accordion.Item>
              <Accordion.Item title="Puis-je partager le fichier à des collaborateurs ?">
                <Text>
                  L’accès à cette liste est strictement personnelle et ne peut en aucun cas être partagée.Un compte
                  utilisateur unique et nominatif doit être créé sur le Tableau de bord de l’apprentissage pour accéder
                  aux données.
                </Text>
              </Accordion.Item>
            </Accordion>

            {/* <Grid templateColumns="repeat(3, 1fr)" gap={3} bg="galt" mt={6} p={12} borderRadius="md">
              <GridItem>
                <Box display="flex" justifyContent="center" alignItems="center">
                  <Image src="/images/contact.svg" alt="France relance" width="100%" userSelect="none" />
                </Box>
              </GridItem>
              <GridItem colSpan={2}>
                <Flex flexDirection="column" justifyContent="center" height="100%" px={12} gap={4}>
                  <Text color="#2F4077" fontSize="beta" fontWeight="700" lineHeight={1.4}>
                    Vous ne trouvez pas la réponse à vos questions ?
                  </Text>
                  <Flex gap={6}>
                    <Link variant="link" display="inline-flex" href={CRISP_FAQ} isExternal width={"fit-content"}>
                      Aide
                      <Box className="ri-arrow-right-line" />
                    </Link>
                    <Link
                      variant="link"
                      display="inline-flex"
                      href="/referencement-organisme"
                      isExternal
                      width={"fit-content"}
                    >
                      Voir la page de référencement
                      <Box className="ri-arrow-right-line" />
                    </Link>
                  </Flex>
                </Flex>
              </GridItem>
            </Grid> */}
          </Box>
        </Flex>
      </Container>
    </SimplePage>
  );
}

export default EffectifsPage;
