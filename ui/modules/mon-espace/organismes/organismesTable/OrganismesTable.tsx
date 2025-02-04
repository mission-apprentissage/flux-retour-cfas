import { Box, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IPaginationFilters } from "shared/models/routes/pagination";

import { Organisme } from "@/common/internal/Organisme";
import TableWithApi from "@/components/Table/TableWithApi";

import organismesTableColumnsDefs from "./OrganismesColumns";

interface OrganismesTableProps {
  organismes: Organisme[];
  pagination: IPaginationFilters;
  onTableChange: (pagination: IPaginationFilters) => void;
  total: number;
  totalFormations: number;
  isFetching: boolean;
}

const OrganismesTable = ({
  organismes,
  pagination,
  onTableChange,
  total,
  totalFormations,
  isFetching,
}: OrganismesTableProps) => {
  const [data, setData] = useState<Organisme[]>([]);

  useEffect(() => {
    setData(organismes);
  }, [organismes]);

  return (
    <Box mt={4}>
      <Text my={10} fontWeight="bold">
        {total} {total <= 1 ? "organisme" : "organismes"} et {totalFormations}{" "}
        {totalFormations <= 1 ? "formation" : "formations"} associée{totalFormations <= 1 ? "" : "s"}.
      </Text>

      <TableWithApi
        data={data as any}
        paginationState={pagination}
        total={total}
        columns={organismesTableColumnsDefs}
        onTableChange={onTableChange}
        isLoading={isFetching}
      />
    </Box>
  );
};

export default OrganismesTable;
