import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, Input, InputGroup, InputRightElement, Switch, Text } from "@chakra-ui/react";
import { UseQueryResult } from "@tanstack/react-query";
import { Row, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

import TableWithApi from "@/components/Table/TableWithApi";

// import ApprenantTableDetails from "../ApprenantsTableDetails";

import apprenantsTableColumnsDefs from "./ApprenantsColumns";
import ApprenantsDetails from "./ApprenantsDetails";
import ApprenantsFilterPanel from "./ApprenantsFilterPanel";

interface ApprenantsTableProps {
  apprenants: any[];
  filters: Record<string, string[]>;
  pagination: any;
  search: string;
  sort: SortingState;
  onPaginationChange: (pagination: any) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: Record<string, string[]>) => void;
  onSortChange: (sort: SortingState) => void;
  total: number;
  availableFilters: Record<string, string[]>;
  resetFilters: () => void;
  isFetching: boolean;
  refetch: (options: { throwOnError: boolean; cancelRefetch: boolean }) => Promise<UseQueryResult>;
}

const ApprenantsTable = ({
  apprenants,
  filters,
  pagination,
  search,
  sort: initialSort,
  onPaginationChange,
  onSearchChange,
  onFilterChange,
  onSortChange,
  total,
  availableFilters,
  resetFilters,
  isFetching,
}: ApprenantsTableProps) => {
  const router = useRouter();

  const [sort, setSort] = useState<SortingState>(initialSort);
  const [localSearch, setLocalSearch] = useState(search || "");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  useEffect(() => {
    setSort(initialSort);
    setLocalSearch(search || "");
  }, [initialSort, search]);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(event.target.value);
  };

  const onSearchButtonClick = () => {
    executeSearch();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      executeSearch();
    }
  };

  const executeSearch = () => {
    onSearchChange(localSearch);

    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, search: localSearch },
      },
      undefined,
      { shallow: true }
    );
  };

  const handlePaginationChange = (newPagination) => {
    onPaginationChange(newPagination);

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

  const handleSortChange = (newSort: SortingState) => {
    onSortChange(newSort);
  };

  return (
    <Box mt={4}>
      <Box border="1px solid" borderColor="openbluefrance" p={4}>
        <HStack mb="4" spacing="8">
          <InputGroup>
            <Input
              type="text"
              name="search_organisme"
              placeholder="Rechercher un apprenant"
              value={localSearch}
              onChange={handleSearchInputChange}
              onKeyDown={handleKeyDown}
              flex="1"
              mr="2"
            />
            <InputRightElement>
              <Button backgroundColor="bluefrance" _hover={{ textDecoration: "none" }} onClick={onSearchButtonClick}>
                <SearchIcon textColor="white" />
              </Button>
            </InputRightElement>
          </InputGroup>
        </HStack>
        <Divider mb="4" />
        <HStack justifyContent="space-between" alignItems="center">
          <ApprenantsFilterPanel
            filters={filters}
            availableFilters={availableFilters}
            onFilterChange={onFilterChange}
            resetFilters={resetFilters}
          />
          <HStack mt={6}>
            <Switch
              variant="icon"
              isChecked={showOnlyErrors}
              onChange={(e) => {
                setShowOnlyErrors(e.target.checked);
              }}
            />
            <Text flexGrow={1}>Afficher les jeunes non contactés</Text>
          </HStack>
        </HStack>
      </Box>

      <Text my={10} fontWeight="bold">
        {total} apprenant(es) trouvé(es)
      </Text>

      <TableWithApi
        data={apprenants}
        paginationState={pagination}
        total={total}
        columns={apprenantsTableColumnsDefs}
        enableRowExpansion={true}
        sortingState={sort}
        onSortingChange={handleSortChange}
        onPaginationChange={handlePaginationChange}
        isLoading={isFetching}
        renderSubComponent={(row: Row<any>) => <ApprenantsDetails row={row} />}
      />
    </Box>
  );
};

export default ApprenantsTable;
