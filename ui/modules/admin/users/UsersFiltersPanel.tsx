import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

const UsersFiltersPanel = () => {
  const router = useRouter();

  //   const { organismesFilters, sort } = useMemo(() => {
  //     const { pagination, sort } = parsePaginationInfosFromQuery(router.query as unknown as PaginationInfosQuery);
  //     return {
  //       organismesFilters: parseOrganismesFiltersFromQuery(router.query as unknown as OrganismesFiltersQuery),
  //       pagination: pagination,
  //       sort: sort ?? [{ desc: false, id: "nom" }],
  //     };
  //   }, [JSON.stringify(router.query)]);

  //   const updateState = (newParams: Partial<{ [key in keyof OrganismesFilters]: any }>) => {
  //     void router.push(
  //       {
  //         pathname: router.pathname,
  //         query: {
  //           ...(router.query.organismeId ? { organismeId: router.query.organismeId } : {}),
  //           ...convertOrganismesFiltersToQuery({ ...organismesFilters, ...newParams }),
  //           ...convertPaginationInfosToQuery({ sort, ...newParams }),
  //         },
  //       },
  //       undefined,
  //       { shallow: true }
  //     );
  //   };

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

        {/* FILTRE Réseau */}

        {/* FILTRE Statut du compte */}

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
