import { Box, Container, Heading, HStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { getAnneeScolaireFromDate } from "shared";

import { _get } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";
import ApprenantsTable from "@/modules/mon-espace/apprenants/apprenantsTable/ApprenantsTable";
import { effectifsStateAtom, effectifFromDecaAtom } from "@/modules/mon-espace/effectifs/engine/atoms";

function EffectifsPage() {
  const router = useRouter();
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const setEffectifFromDecaState = useSetRecoilState(effectifFromDecaAtom);

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
    data: apprenantsData,
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

      const { fromDECA, total, filters: returnedFilters, organismesEffectifs } = response;

      setCurrentEffectifsState(
        organismesEffectifs.reduce((acc, { id, validation_errors }) => {
          acc.set(id, { validation_errors, requiredSifa: [] });
          return acc;
        }, new Map())
      );

      setEffectifFromDecaState(fromDECA);

      return { total, filters: returnedFilters, organismesEffectifs };
    },
    { keepPreviousData: true }
  );

  console.log("CONSOLE LOG ~ EffectifsPage ~ data:", apprenantsData);
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

        <Box mt={10} mb={16}>
          <ApprenantsTable
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
      </Container>
    </SimplePage>
  );
}

export default EffectifsPage;
