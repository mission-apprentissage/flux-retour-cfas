import { Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AccessorKeyColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import TableWithPagination from "@/components/Table/TableWithPagination";
import { transmissionSuccessDetailsCountAtom } from "@/hooks/tranmissions";

const transmissionByDayColumnDefs: AccessorKeyColumnDef<any, any>[] = [
  {
    size: 300,
    header: () => "Nom de l'établissement",
    accessorKey: "organisme_name",
    cell: ({ row }) => (
      <Text fontSize="1rem" padding={1}>
        {row.original.name}
      </Text>
    ),
  },
  {
    size: 200,
    header: () => "SIRET",
    accessorKey: "organisme_siret",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.siret}</Text>,
  },
  {
    size: 200,
    header: () => "UAI",
    accessorKey: "organisme_uai",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.uai}</Text>,
  },
  {
    size: 300,
    header: () => "Adresse",
    accessorKey: "organisme_address",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.adresse}</Text>,
  },
  {
    size: 100,
    header: () => "Effectifs",
    accessorKey: "organisme_effectifs",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.effectifCount}</Text>,
  },
];

interface TransmissionSuccessPageProps {
  organisme: Organisme;
  date: string;
}

const TransmissionSuccessDetailsTable = (props: TransmissionSuccessPageProps) => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [totalPageCount, setTotalPageCount] = useState(1);
  const [transmissionData, setTransmissionData] = useState([]);
  const setTotalEffectifs = useSetRecoilState(transmissionSuccessDetailsCountAtom);

  const computeQueryResponse = (successData: { data: any; pagination: any; totalEffectifs: number }, error: any) => {
    if (error) {
      computeError();
      return;
    }
    computeSuccess(successData);
  };

  const computeSuccess = (successData: { data: any; pagination: any; totalEffectifs: number }) => {
    calculatePageCount(successData?.pagination, successData?.totalEffectifs);
    setTransmissionData(successData?.data ?? []);
  };

  const computeError = () => {
    setTransmissionData([]);
  };

  const calculatePageCount = (paginationResult: { limit: number; total: number }, totalEffectifs) => {
    if (!paginationResult) {
      setTotalEffectifs(0);
      return;
    }

    const { limit, total } = paginationResult;
    setTotalEffectifs(totalEffectifs);
    setTotalPageCount(Math.ceil(total / limit));
  };

  const onPageChange = (page: number) => {
    setPagination({ ...pagination, pageIndex: page });
  };

  const onLimitChange = (limit: number) => {
    setPagination({ pageIndex: 0, pageSize: limit });
  };

  const { data, error, isFetching } = useQuery({
    queryKey: ["transmissions-details-success", pagination],
    queryFn: () =>
      _get(`/api/v1/organismes/${props.organisme._id}/transmission/${props.date}/success`, {
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
      pageCount={totalPageCount}
      onLimitChange={onLimitChange}
      loading={isFetching}
    />
  );
};

export default TransmissionSuccessDetailsTable;
