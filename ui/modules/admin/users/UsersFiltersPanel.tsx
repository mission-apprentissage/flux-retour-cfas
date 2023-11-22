import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo } from "react";

import {
  PaginationInfosQuery,
  convertPaginationInfosToQuery,
  parsePaginationInfosFromQuery,
} from "@/modules/models/pagination";

import FiltreUsersAccountStatut from "./filters/FiltreUsersAccountStatut";
import FiltreUserTypes from "./filters/FiltreUsersType";
import {
  UsersFilters,
  UsersFiltersQuery,
  convertUsersFiltersToQuery,
  parseUsersFiltersFromQuery,
} from "./models/users-filters";

const UsersFiltersPanel = () => {
  const router = useRouter();

  const { usersFilters, sort } = useMemo(() => {
    const { pagination, sort } = parsePaginationInfosFromQuery(router.query as unknown as PaginationInfosQuery);
    return {
      usersFilters: parseUsersFiltersFromQuery(router.query as unknown as UsersFiltersQuery),
      pagination: pagination,
      sort: sort ?? [{ desc: false, id: "nom" }],
    };
  }, [JSON.stringify(router.query)]);

  const updateState = (newParams: Partial<{ [key in keyof UsersFilters]: any }>) => {
    void router.push(
      {
        pathname: router.pathname,
        query: {
          ...(router.query.organismeId ? { organismeId: router.query.organismeId } : {}),
          ...convertUsersFiltersToQuery({ ...usersFilters, ...newParams }),
          ...convertPaginationInfosToQuery({ sort, ...newParams }),
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const resetFilters = () => {
    void router.push(
      {
        pathname: router.pathname,
        query: { ...(router.query.organismeId ? { organismeId: router.query.organismeId } : {}) },
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <Stack spacing="0.5">
      <Text fontSize="zeta" fontWeight="extrabold">
        FILTRER PAR
      </Text>
      <HStack>
        {/* FILTRE Département */}

        {/* FILTRE Région */}

        {/* FILTRE Type Utilisateur */}
        <FiltreUserTypes
          value={usersFilters.type_utilisateur}
          onChange={(type_utilisateur) => updateState({ type_utilisateur })}
        />

        {/* FILTRE Réseau */}

        {/* FILTRE Statut du compte */}
        <FiltreUsersAccountStatut
          value={usersFilters.account_status}
          onChange={(account_status) => updateState({ account_status })}
        />

        {/* FILTRE Période */}

        {/* REINITIALISER */}
        <Button variant="link" onClick={resetFilters} fontSize="omega">
          réinitialiser
        </Button>
      </HStack>
    </Stack>
  );
};

export default UsersFiltersPanel;
