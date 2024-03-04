import { HStack, Text, Button } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AccessorKeyColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import TableWithPagination from "@/components/Table/TableWithPagination";
import { ArrowRightLine, ValidateIcon } from "@/theme/components/icons";
import { CloseCircle } from "@/theme/components/icons/CloseCircle";

const computeTextErrorDisplay = (count = 0) => {
  return Number(count) > 0 ? { color: "error", fontWeight: "bold" } : {};
};
const transmissionByDayColumnDefs: AccessorKeyColumnDef<any, any>[] = [
  {
    header: () => "Date de transmission",
    accessorKey: "day",
    cell: ({ row }) => <Text fontSize="1rem">{formatDateNumericDayMonthYear(row.original.day)}</Text>,
  },
  {
    header: () => "Transmission",
    accessorKey: "status",
    cell: ({ row }) => <Text>{formatStatut(row.original.success, row.original.error)}</Text>,
  },
  {
    header: () => "Effectifs transmis",
    accessorKey: "success",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.success}</Text>,
  },
  {
    header: () => "Effectifs en échec",
    accessorKey: "error",
    cell: ({ row }) => (
      <Text fontSize="1rem" {...computeTextErrorDisplay(row.original.error)}>
        {" "}
        {row.original.error}
      </Text>
    ),
  },
  {
    header: () => "Total effectifs",
    accessorKey: "total",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.total}</Text>,
  },
  {
    accessorKey: "more",
    enableSorting: false,
    header: () => "Voir",
    cell: ({ row }) => (
      <Link href={`/transmissions/${row.original.day as any}`}>
        <Button pl={0} pr={0} h={8} w={8} minW={8} backgroundColor="#F5F5FE">
          <ArrowRightLine fontSize="12px" color="#000091" />
        </Button>
      </Link>
    ),
  },
];

const formatStatut = (success: number, error: number) => {
  return error ? (
    <HStack color="error">
      <CloseCircle boxSize={4} />
      <Text fontSize="1rem">Incomplète</Text>
    </HStack>
  ) : (
    <HStack color="flatsuccess" w="full">
      <ValidateIcon boxSize={4} />
      <Text fontSize="1rem">Complète</Text>
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
      loading={isFetching}
    />
  );
};

export default TransmissionByDayTable;
