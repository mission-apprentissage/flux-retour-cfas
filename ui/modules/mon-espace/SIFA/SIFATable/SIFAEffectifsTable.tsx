import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, Input, InputGroup, InputRightElement, Text } from "@chakra-ui/react";
import { UseQueryResult } from "@tanstack/react-query";
import { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { getSIFADate } from "shared";
import { IPaginationFilters } from "shared/models/routes/pagination";

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
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: SIFAFilterType) => void;
  onTableChange: (pagination: IPaginationFilters) => void;
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
  onSearchChange,
  onFilterChange,
  onTableChange,
  total,
  availableFilters,
  resetFilters,
  isFetching,
  canEdit,
  modeSifa,
  refetch,
}: EffectifsTableProps) => {
  const router = useRouter();

  const [localSearch, setLocalSearch] = useState(search || "");

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

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

  const handleTableChange = (newPagination: IPaginationFilters) => {
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          ...newPagination,
        },
      },
      undefined,
      { shallow: true }
    );
    onTableChange(newPagination);
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
        onTableChange={handleTableChange}
        isLoading={isFetching}
        renderSubComponent={(row: Row<any>) => (
          <EffectifTableDetails row={row} modeSifa={modeSifa} canEdit={canEdit} refetch={refetch} />
        )}
      />
    </Box>
  );
};

export default EffectifsTable;
