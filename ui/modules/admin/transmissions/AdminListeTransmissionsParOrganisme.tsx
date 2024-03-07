import { ArrowBackIcon } from "@chakra-ui/icons";
import { Container, Heading, HStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AccessorKeyColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";

import { _get } from "@/common/httpClient";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import TableWithPagination from "@/components/Table/TableWithPagination";

const computeTextErrorDisplay = (count = 0) => {
  return Number(count) > 0 ? { color: "error", fontWeight: "bold" } : {};
};

const adminTransmissionByDayColumnDefs: AccessorKeyColumnDef<any, any>[] = [
  {
    size: 200,
    header: () => "Organisme",
    accessorKey: "organisme",
    cell: ({ row }) => (
      <Link href={`/organismes/${row.original.organisme.id}`} color="bluefrance">
        <Text fontSize="1rem" padding={1}>
          {row.original.organisme.nom}
        </Text>
      </Link>
    ),
  },
  {
    size: 200,
    header: () => "SIRET",
    accessorKey: "organisme_siret",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.organisme.siret}</Text>,
  },
  {
    header: () => "UAI",
    accessorKey: "organisme_uai",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.organisme.uai}</Text>,
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
];

interface AdminListeTransmissionsParOrganismeProps {
  date: string;
}
const AdminListeTransmissionsParOrganisme = (props: AdminListeTransmissionsParOrganismeProps) => {
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
    queryKey: ["transmissions-details-admin", pagination],
    queryFn: () =>
      _get(`/api/v1/admin/transmissions/${props.date}/error`, {
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
    <SimplePage>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Rapport du {formatDateNumericDayMonthYear(props.date)}
        </Heading>
        <HStack mt={10} mb={10}>
          <Link
            href={`/admin/transmissions`}
            color="action-high-blue-france"
            borderBottom="1px"
            _hover={{ textDecoration: "none" }}
          >
            <ArrowBackIcon mr={2} />
            Retour au tableau des rapports
          </Link>
          Mes erreurs de transmissions du {formatDateNumericDayMonthYear(props.date)}
        </HStack>
        <TableWithPagination
          data={transmissionData}
          columns={adminTransmissionByDayColumnDefs}
          onPageChange={(page) => onPageChange(page)}
          paginationState={pagination}
          pageCount={totalCount}
          onLimitChange={onLimitChange}
          loading={isFetching}
        />
      </Container>
    </SimplePage>
  );
};

export default AdminListeTransmissionsParOrganisme;
