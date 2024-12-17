import { AddIcon } from "@chakra-ui/icons";
import { Box, Container, Heading, HStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { DuplicateEffectifGroupPagination, EFFECTIFS_GROUP } from "shared";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import Link from "@/components/Links/Link";
import SupportLink from "@/components/Links/SupportLink";
import SimplePage from "@/components/Page/SimplePage";

import { effectifFromDecaAtom, effectifsStateAtom } from "../mon-espace/effectifs/engine/atoms";
import EffectifsTable from "../mon-espace/effectifs/engine/effectifsTable/EffectifsTable";
import BandeauTransmission from "../organismes/BandeauTransmission";

import BandeauDuplicatsEffectifs from "./BandeauDuplicatsEffectifs";

interface EffectifsPageProps {
  organisme: Organisme;
  modePublique: boolean;
}

function EffectifsPage(props: EffectifsPageProps) {
  const router = useRouter();
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const setEffectifFromDecaState = useSetRecoilState(effectifFromDecaAtom);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<SortingState>([{ desc: true, id: "annee_scolaire" }]);

  useEffect(() => {
    const parseQueryToFilters = (query: Record<string, string | undefined>) => {
      const filters: Record<string, string[]> = {};
      Object.entries(query).forEach(([key, value]) => {
        if (
          value &&
          key !== "pageIndex" &&
          key !== "pageSize" &&
          key !== "search" &&
          key !== "sortField" &&
          key !== "sortOrder"
        ) {
          try {
            if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
              const parsed = JSON.parse(decodeURIComponent(value));
              filters[key] = Array.isArray(parsed) ? parsed : [parsed];
            } else {
              filters[key] = [decodeURIComponent(value)];
            }
          } catch {
            filters[key] = [decodeURIComponent(value)];
          }
        }
      });
      return filters;
    };

    const parsedFilters = parseQueryToFilters(router.query as Record<string, string | undefined>);
    setFilters(parsedFilters || {});
  }, [router.query]);

  const { data, isFetching } = useQuery(
    ["organismes", props.organisme._id, "effectifs", pagination, search, filters, sort],
    async () => {
      const response = await _get(`/api/v1/organismes/${props.organisme._id}/effectifs`, {
        params: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          search,
          sortField: sort[0]?.id,
          sortOrder: sort[0]?.desc ? "desc" : "asc",
          ...filters,
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

  const { data: duplicates } = useQuery(["organismes", props.organisme._id, "duplicates"], () =>
    _get<DuplicateEffectifGroupPagination>(`/api/v1/organismes/${props.organisme?._id}/duplicates`)
  );

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
    setPagination({ ...pagination, pageIndex: 0 });
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
    setPagination({ ...pagination, pageIndex: 0 });
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
    setPagination({ ...pagination, pageIndex: 0 });
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

    router.push(
      {
        pathname: router.pathname,
        query: {},
      },
      undefined,
      { shallow: true }
    );
  };

  const title = `${props.modePublique ? "Ses" : "Mes"} effectifs`;

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <HStack justifyContent="space-between" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            {title}
          </Heading>

          <div>
            <HStack gap={4}>
              <SupportLink href={EFFECTIFS_GROUP}></SupportLink>
              <Link variant="whiteBg" href={`${router.asPath}/televersement`}>
                <AddIcon boxSize={3} mr={2} />
                Ajouter via fichier Excel
              </Link>
            </HStack>
          </div>
        </HStack>

        {data?.organismesEffectifs?.length === 0 && Object.keys(filters).length === 0 && (
          <BandeauTransmission organisme={props.organisme} modePublique={props.modePublique} />
        )}

        {!props.modePublique && duplicates && duplicates?.totalItems > 0 && (
          <BandeauDuplicatsEffectifs totalItems={duplicates?.totalItems} />
        )}

        <Box mt={10} mb={16}>
          <EffectifsTable
            organisme={props.organisme}
            organismesEffectifs={data?.organismesEffectifs || []}
            filters={filters}
            pagination={pagination}
            search={search}
            sort={sort}
            onPaginationChange={handlePaginationChange}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            total={data?.total || 0}
            availableFilters={data?.filters || {}}
            resetFilters={resetFilters}
            isFetching={isFetching}
          />
        </Box>
      </Container>
    </SimplePage>
  );
}

export default EffectifsPage;
