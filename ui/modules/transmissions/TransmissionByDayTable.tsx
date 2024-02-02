import { Box, HStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AccessorKeyColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import TableWithPagination from "@/components/Table/TableWithPagination";
import { ArrowDropRightLine, Checkbox } from "@/theme/components/icons";
import { CloseCircle } from "@/theme/components/icons/CloseCircle";

const transmissionByDayColumnDefs: AccessorKeyColumnDef<any, any>[] = [
  {
    header: () => "Date",
    accessorKey: "day",
    cell: ({ row }) => <Text>{formatDateNumericDayMonthYear(row.original.day)}</Text>,
  },
  {
    header: () => "Statut",
    accessorKey: "status",
    cell: ({ row }) => <Text>{formatStatut(row.original.success, row.original.error)}</Text>,
  },
  {
    header: () => "Import réussi",
    accessorKey: "success",
    cell: ({ row }) => <Text>{row.original.success}</Text>,
  },
  {
    header: () => "Import en échec",
    accessorKey: "error",
    cell: ({ row }) => <Text>{row.original.error}</Text>,
  },
  {
    header: () => "Total",
    accessorKey: "total",
    cell: ({ row }) => <Text>{row.original.total}</Text>,
  },
  {
    accessorKey: "more",
    enableSorting: false,
    header: () => "Voir",
    cell: ({ row }) => (
      <Link href={`/transmissions/${row.original.day as any}`} flexGrow={1}>
        <ArrowDropRightLine />
      </Link>
    ),
  },
];

const formatStatut = (success: number, error: number) => {
  return error ? (
    <HStack paddingX="1w" paddingY="2px" borderRadius={6} lineHeight="2em" color="error">
      <CloseCircle />
      <Text fontSize="zeta" fontWeight="bold"></Text>
    </HStack>
  ) : (
    <HStack paddingX="1w" paddingY="2px" borderRadius={6} color="greensoft.600">
      <Checkbox />
      <Box>
        <Text fontSize="zeta" fontWeight="bold"></Text>
      </Box>
    </HStack>
  );
};
interface TransmissionPageProps {
  organisme: Organisme;
}

const TransmissionByDayTable = (props: TransmissionPageProps) => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [totalCount, setTotalCount] = useState(2);
  const [transmissionData, setTransmissionData] = useState([]);

  const computeQueryResponse = (successData: { data: any; pagination: any }, error: any) => {
    if (error) {
      computeError();
      return;
    }
    computeSuccess(successData);
  };

  const computeSuccess = (successData: { data: any; pagination: any }) => {
    calculatePageCount(successData?.pagination);
    setTransmissionData(successData?.data ?? []);
  };

  const computeError = () => {
    setTransmissionData([]);
  };

  const calculatePageCount = (paginationResult: { limit: number; total: number }) => {
    if (!paginationResult) {
      return;
    }

    const { limit, total } = paginationResult;
    setTotalCount(Math.ceil(total / limit));
  };

  const onPageChange = (page: number) => {
    setPagination({ ...pagination, pageIndex: page });
  };

  const onLimitChange = (limit: number) => {
    setPagination({ pageIndex: 0, pageSize: limit });
  };

  const { data, error, isFetching } = useQuery({
    queryKey: ["transmissions", pagination],
    queryFn: () =>
      _get(`/api/v1/organismes/${props.organisme._id}/transmission`, {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        },
      }),
  });
  useEffect(() => {
    computeQueryResponse(data, error);
  }, [isFetching, error, data]);

  return (
    <TableWithPagination
      data={transmissionData}
      columns={transmissionByDayColumnDefs}
      onPageChange={(page) => onPageChange(page)}
      paginationState={pagination}
      pageCount={totalCount}
      onLimitChange={onLimitChange}
    />
  );
};

export default TransmissionByDayTable;
