import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, Input, InputGroup, InputRightElement, Text } from "@chakra-ui/react";
import { Row } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { Commune, IEffectif, IMissionLocaleEffectif } from "shared";
import { IPaginationFilters } from "shared/models/routes/pagination";

import TableWithApi from "@/components/Table/TableWithApi";

import apprenantsTableColumnsDefs from "./ApprenantsColumns";
import ApprenantsDetails from "./ApprenantsDetails";
import ApprenantsFilterPanel from "./ApprenantsFilterPanel";

type IEffectifWithSituation = Omit<IEffectif, "_id"> & {
  id: string;
  situation_data?: {
    situation?: string;
    situation_updated_at?: string;
  };
};

interface ApprenantsTableProps {
  apprenants: IEffectifWithSituation[];
  communes: Commune[];
  filters: Record<string, string[]>;
  pagination: IPaginationFilters;
  search: string;
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: Record<string, string[]>) => void;
  onTableChange: (pagination: IPaginationFilters) => void;
  total: number;
  availableFilters: Record<string, string[]>;
  resetFilters: () => void;
  isFetching: boolean;
}

const ApprenantsTable = ({
  apprenants,
  communes,
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
}: ApprenantsTableProps) => {
  console.log("CONSOLE LOG ~ apprenants:", apprenants);
  const [data, setData] = useState<IEffectifWithSituation[]>([]);
  const [localSearch, setLocalSearch] = useState(search || "");

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  useEffect(() => {
    setData(apprenants);
  }, [apprenants]);

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
  };

  const updateSituationState = (effectifId: string, newSituation: Partial<IMissionLocaleEffectif>) => {
    setData((prevData) =>
      prevData.map((apprenant) =>
        apprenant.id === effectifId
          ? ({
              ...apprenant,
              situation_data: {
                ...apprenant.situation_data,
                ...newSituation,
                situation_updated_at: new Date().toISOString(),
              },
            } as IEffectifWithSituation)
          : apprenant
      )
    );
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
            communes={communes}
          />
        </HStack>
      </Box>

      <Text my={10} fontWeight="bold">
        {total} apprenant(es) trouvé(es)
      </Text>

      <TableWithApi
        data={data}
        paginationState={pagination}
        total={total}
        columns={apprenantsTableColumnsDefs(updateSituationState)}
        enableRowExpansion={true}
        onTableChange={onTableChange}
        isLoading={isFetching}
        renderSubComponent={(row: Row<any>) => (
          <ApprenantsDetails row={row} updateSituationState={updateSituationState} />
        )}
      />
    </Box>
  );
};

export default ApprenantsTable;
