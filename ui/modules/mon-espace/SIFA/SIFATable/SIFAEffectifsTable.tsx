import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, Input, InputGroup, InputRightElement, Text } from "@chakra-ui/react";
import { UseQueryResult } from "@tanstack/react-query";
import { ColumnDef, Row, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { getSIFADate } from "shared";

import { Organisme } from "@/common/internal/Organisme";
import TableWithApi from "@/components/Table/TableWithApi";

import EffectifTableDetails from "../../effectifs/engine/EffectifsTableDetails";

import SIFAeffectifsTableColumnsDefs from "./SIFAEffectifsColumns";
import SIFAEffectifsFilterPanel, { SIFAFilterType } from "./SIFAEffectifsFilterPanel";

interface EffectifsTableProps {
  organisme: Organisme;
  organismesEffectifs: any[];
  filters: SIFAFilterType;
  pagination: any;
  search: string;
  sort: SortingState;
  onPaginationChange: (pagination: any) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: SIFAFilterType) => void;
  onSortChange: (sort: SortingState) => void;
  total: number;
  availableFilters: SIFAFilterType;
  resetFilters: () => void;
  isFetching: boolean;
  canEdit?: boolean;
  modeSifa?: boolean;
  refetch: (options: { throwOnError: boolean; cancelRefetch: boolean }) => Promise<UseQueryResult>;
}

const EffectifsTable = ({
  organismesEffectifs,
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
  canEdit,
  modeSifa,
  refetch,
}: EffectifsTableProps) => {
  const router = useRouter();

  const [sort, setSort] = useState<SortingState>(initialSort);
  const [localSearch, setLocalSearch] = useState(search || "");

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
        <SIFAEffectifsFilterPanel
          filters={filters}
          availableFilters={availableFilters}
          onFilterChange={onFilterChange}
          resetFilters={resetFilters}
        />
      </Box>

      <Text my={10} fontWeight="bold">
        Vous avez {total} effectifs au total, en contrat au 31 décembre {getSIFADate(new Date()).getUTCFullYear()}
      </Text>

      <TableWithApi
        data={organismesEffectifs}
        paginationState={pagination}
        total={total}
        columns={SIFAeffectifsTableColumnsDefs({ modeSifa, organismesEffectifs }) as ColumnDef<any, any>[]}
        enableRowExpansion={true}
        sortingState={sort}
        onSortingChange={handleSortChange}
        onPaginationChange={handlePaginationChange}
        isLoading={isFetching}
        renderSubComponent={(row: Row<any>) => (
          <EffectifTableDetails row={row} modeSifa={modeSifa} canEdit={canEdit} refetch={refetch} />
        )}
      />
    </Box>
  );
};

export default EffectifsTable;
