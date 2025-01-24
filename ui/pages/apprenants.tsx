import { Box, Container, Heading, HStack, VStack, Text, Link, Flex, ListItem, UnorderedList } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IEffectifsFiltersMissionLocale } from "shared/models/routes/mission-locale/missionLocale.api";
import { IPaginationFilters, paginationFiltersSchema } from "shared/models/routes/pagination";
import { z } from "zod";

import { _get } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import ApprenantsTable from "@/modules/mon-espace/apprenants/apprenantsTable/ApprenantsTable";

const DEFAULT_PAGINATION: IPaginationFilters = {
  page: 0,
  limit: 10,
  sort: "statut",
  order: "desc",
};

function EffectifsPage() {
  const router = useRouter();

  const [state, setState] = useState({
    pagination: DEFAULT_PAGINATION,
    search: "",
    filters: { statut: [] } as IEffectifsFiltersMissionLocale,
  });

  useEffect(() => {
    const defaultFilterParser = (value) => {
      if (!value) return;
      const values = Array.isArray(value) ? value : [value];
      try {
        return values
          .map((v) => {
            const decodedValue = decodeURIComponent(v);
            return decodedValue.startsWith("[") && decodedValue.endsWith("]")
              ? JSON.parse(decodedValue)
              : [decodedValue];
          })
          .flat();
      } catch {
        return values.map((v) => decodeURIComponent(v));
      }
    };

    const parseFilter = (key: string, value: string | string[] | undefined) => {
      const directFilters = ["rqth", "mineur", "last_update_value", "last_update_order", "a_risque"];
      const parsedFilters = ["statut", "niveaux", "code_insee", "situation"];

      if (directFilters.includes(key)) return value;
      if (parsedFilters.includes(key)) return defaultFilterParser(value);
      return undefined;
    };

    const filterKeys = [
      "statut",
      "rqth",
      "mineur",
      "niveaux",
      "code_insee",
      "last_update_value",
      "last_update_order",
      "situation",
      "a_risque",
    ];
    const paginationKeys = ["limit", "page", "order", "sort"];
    const searchFilter = router.query.search;

    const filters: IEffectifsFiltersMissionLocale = {};
    const updatedPagination = { ...state.pagination };

    filterKeys.forEach((key) => {
      const parsedFilter = parseFilter(key, router.query[key]);
      if (parsedFilter) {
        filters[key] = parsedFilter;
      }
    });

    paginationKeys.forEach((key) => {
      if (router.query[key]) updatedPagination[key] = router.query[key];
    });

    setState((prev) => ({
      ...prev,
      filters,
      search: searchFilter ? (searchFilter as string) : prev.search,
      pagination: z.object(paginationFiltersSchema).parse(updatedPagination),
    }));
  }, [router.query]);

  const { data: apprenants, isFetching } = useQuery(
    ["apprenants", state.pagination, state.search, state.filters],
    async () => {
      return await _get(`/api/v1/organisation/mission-locale/effectifs`, {
        params: {
          page: state.pagination.page,
          limit: state.pagination.limit,
          sort: state.pagination.sort,
          order: state.pagination.order,
          search: state.search,
          ...state.filters,
        },
      });
    },
    { keepPreviousData: true }
  );

  const updateState = (key: string, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleTableChange = (newPagination: IPaginationFilters) => {
    updateState("pagination", newPagination);
    router.push({ pathname: router.pathname, query: { ...router.query, ...newPagination } }, undefined, {
      shallow: true,
    });
  };

  const handleSearchChange = (value: string) => {
    updateState("search", value);
    router.push({ pathname: router.pathname, query: { ...router.query, search: value } }, undefined, { shallow: true });
  };

  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page: 0 }, filters: newFilters }));
    router.push({ pathname: router.pathname, query: { ...router.query, ...newFilters, page: 0 } }, undefined, {
      shallow: true,
    });
  };

  const resetFilters = () => {
    setState({ pagination: DEFAULT_PAGINATION, search: "", filters: {} });
    router.push({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
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
            Retrouvez ci-dessous les <strong>{apprenants?.pagination.total}</strong> jeunes et leurs coordonnées,
            susceptibles d&apos;être intéressés par une mise en relation avec une Mission Locale. Cliquez sur chaque
            jeune pour plus d’informations sur son parcours.
          </Text>
          <Text fontStyle="italic">
            Sources : CFA et{" "}
            <Link
              isExternal
              textDecoration="underLine"
              color="bluefrance"
              href="https://efpconnect.emploi.gouv.fr/auth"
            >
              DECA
            </Link>
            <InfoTooltip
              popoverWidth="lg"
              headerComponent={() => "Source des effectifs en apprentissage"}
              contentComponent={() => (
                <Box>
                  <Text>Les données affichées sur votre espace proviennent :</Text>
                  <UnorderedList mt={4}>
                    <ListItem>
                      soit des CFA qui partagent leurs effectifs au Tableau de bord (via API ou partage de fichier
                      Excel)
                    </ListItem>
                    <ListItem>
                      soit de la plateforme DECA (DEpôt des Contrats en Alternance) : concerne les effectifs en rupture
                      de contrat ou en abandon.
                    </ListItem>
                  </UnorderedList>
                </Box>
              )}
            />
          </Text>
          <Ribbons variant="alert" showClose>
            <Flex direction="column" ml={3} gap={2} justifyContent="flex-start">
              <Text color="grey.800">
                Nous vous mettons à disposition les contacts des jeunes et leur CFA : vous êtes encouragé à les
                contacter. Ne partagez pas ces listes.
              </Text>
            </Flex>
          </Ribbons>
        </VStack>

        <Box mt={10} mb={16}>
          <ApprenantsTable
            apprenants={apprenants?.data}
            communes={apprenants?.filter}
            filters={state.filters}
            pagination={state.pagination}
            search={state.search}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onTableChange={handleTableChange}
            total={apprenants?.pagination.total || 0}
            availableFilters={apprenants?.filters || {}}
            resetFilters={resetFilters}
            isFetching={isFetching}
          />
        </Box>
      </Container>
    </SimplePage>
  );
}

export default EffectifsPage;
