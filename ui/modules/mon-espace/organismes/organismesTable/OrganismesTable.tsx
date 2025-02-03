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
  isFetching: boolean;
}

const OrganismesTable = ({ organismes, pagination, onTableChange, total, isFetching }: OrganismesTableProps) => {
  const [data, setData] = useState<Organisme[]>([]);

  useEffect(() => {
    setData(organismes);
  }, [organismes]);

  const formationsTotal = organismes.reduce((acc, org) => acc + (org.formationsCount || 0), 0);

  return (
    <Box mt={4}>
      <Text my={10} fontWeight="bold">
        {total} organismes et {formationsTotal} formations associées
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
