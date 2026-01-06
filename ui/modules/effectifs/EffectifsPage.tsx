import { AddIcon } from "@chakra-ui/icons";
import { Box, Container, Heading, HStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { DuplicateEffectifGroupPagination, EFFECTIFS_GROUP, getAnneeScolaireFromDate } from "shared";
import { IPaginationFilters, paginationFiltersSchema } from "shared/models/routes/pagination";
import { z } from "zod";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import Link from "@/components/Links/Link";
import SupportLink from "@/components/Links/SupportLink";
import SimplePage from "@/components/Page/SimplePage";

import { effectifsStateAtom } from "../mon-espace/effectifs/engine/atoms";
import EffectifsTable from "../mon-espace/effectifs/engine/effectifsTable/EffectifsTable";
import BandeauTransmission from "../organismes/BandeauTransmission";

import BandeauDuplicatsEffectifs from "./BandeauDuplicatsEffectifs";

interface EffectifsPageProps {
  organisme: Organisme;
  modePublique: boolean;
}

const DEFAULT_PAGINATION: IPaginationFilters = {
  page: 0,
  limit: 10,
  sort: "annee_scolaire",
  order: "desc",
};

function EffectifsPage(props: EffectifsPageProps) {
  const router = useRouter();
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);

  const [pagination, setPagination] = useState<IPaginationFilters>(DEFAULT_PAGINATION);
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string[]>>({
    annee_scolaire: [getAnneeScolaireFromDate(new Date())],
  });

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
    const mergedPagination = { ...pagination };

    const filterKeys = ["formation_libelle_long", "statut_courant", "annee_scolaire", "source", "search"];
    const paginationKeys = ["limit", "page", "order", "sort"];
    const searchFilter = router.query.search;

    filterKeys.forEach((key) => {
      const parsedFilter = parseFilter(key, router.query[key]);
      if (parsedFilter) {
        mergedFilters[key] = parsedFilter.flat();
      }
    });

    paginationKeys.forEach((key) => {
      const parsedValue = router.query[key];
      if (parsedValue) {
        mergedPagination[key] = parsedValue;
      }
    });

    if (JSON.stringify(mergedFilters) !== JSON.stringify(filters)) {
      setFilters(mergedFilters);
    }

    if (searchFilter) {
      setSearch(searchFilter as string);
    }

    const zodPagination = z.object(paginationFiltersSchema).parse(mergedPagination);

    setPagination(zodPagination);
  }, [router.query]);

  const { data, isFetching } = useQuery(
    ["organismes", props.organisme._id, "effectifs", pagination, search, filters],
    async () => {
      const { page, limit, sort, order } = pagination;
      const { formation_libelle_long, statut_courant, annee_scolaire, source } = filters;
      const response = await _get(`/api/v1/organismes/${props.organisme._id}/effectifs`, {
        params: {
          page: page ?? DEFAULT_PAGINATION.page,
          limit: limit ?? DEFAULT_PAGINATION.limit,
          sort: sort ?? DEFAULT_PAGINATION.sort,
          order: order ?? DEFAULT_PAGINATION.order,
          search,
          formation_libelle_long,
          statut_courant,
          annee_scolaire,
          source,
        },
      });

      const { total, filters: returnedFilters, organismesEffectifs } = response;

      setCurrentEffectifsState(
        organismesEffectifs.reduce((acc, { id, validation_errors }) => {
          acc.set(id, { validation_errors });
          return acc;
        }, new Map())
      );

      return { total, filters: returnedFilters, organismesEffectifs };
    },
    { keepPreviousData: true }
  );

  const { data: duplicates } = useQuery(["organismes", props.organisme._id, "duplicates"], () =>
    _get<DuplicateEffectifGroupPagination>(`/api/v1/organismes/${props.organisme?._id}/duplicates`)
  );

  const handleTableChange = (newPagination: IPaginationFilters) => {
    setPagination(newPagination);

    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, ...newPagination },
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

    if (!updatedQuery.organismeId) {
      updatedQuery.organismeId = router.query.organismeId as string;
    }

    Object.keys(router.query).forEach((key) => {
      if (!queryFilters[key] && key !== "organismeId") {
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
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onTableChange={handleTableChange}
            total={data?.total || 0}
            availableFilters={data?.filters || {}}
            resetFilters={resetFilters}
            isFetching={isFetching}
            canEdit={false}
          />
        </Box>
      </Container>
    </SimplePage>
  );
}

export default EffectifsPage;
