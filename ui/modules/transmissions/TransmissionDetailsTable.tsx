import { Box, Text, Flex, SimpleGrid } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AccessorKeyColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import TableWithPagination from "@/components/Table/TableWithPagination";

const ErreurDisplayComponent = ({ effectif }) => {
  const errors = effectif.validation_errors;
  const id = effectif._id;
  return errors && errors.length ? (
    errors.map(({ message, path }) => {
      return (
        <SimpleGrid columns={2} key={id} padding={2}>
          <Box>
            <Flex>{message}</Flex>
          </Box>
          <Box>
            <Flex flexDirection="column" pl={10}>
              <Box>
                {path.map((v) => (
                  <Text key={`${id}-${message}`}>
                    {v} : {effectif[v] ?? <i>null</i>}
                  </Text>
                ))}
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>
      );
    })
  ) : (
    <Box padding={2}>
      <Text>
        <i>Erreur inconnue</i>
      </Text>
    </Box>
  );
};

const transmissionByDayColumnDefs: AccessorKeyColumnDef<any, any>[] = [
  {
    size: 200,
    header: () => "Effectif",
    accessorKey: "effectif",
    cell: ({ row }) => <Text>{`${row.original.prenom_apprenant} ${row.original.nom_apprenant}`}</Text>,
  },
  {
    size: 600,
    header: () => "Erreur",
    accessorKey: "error",
    cell: ({ row }) => <ErreurDisplayComponent effectif={row.original} />,
  },
];

interface TransmissionPageProps {
  organisme: Organisme;
  date: string;
}

const TransmissionDetailsTable = (props: TransmissionPageProps) => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [totalCount, setTotalCount] = useState(1);
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
      _get(`/api/v1/organismes/${props.organisme._id}/transmission/${props.date}`, {
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

export default TransmissionDetailsTable;
