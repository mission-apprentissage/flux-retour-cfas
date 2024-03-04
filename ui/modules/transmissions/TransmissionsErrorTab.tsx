import { Text, Box } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { transmissionErrorsDetailsCountAtom } from "@/hooks/tranmissions";
import TransmissionErrorDetailsTable from "@/modules/transmissions/TransmissionErrorDetailsTable";

import TransmissionsErrorSummary from "./TransmissionsErrorSummary";

interface TransmissionsErrorTabProps {
  organisme: Organisme;
  date: string;
}
const TransmissionsErrorTab = (props: TransmissionsErrorTabProps) => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [transmissionData, setTransmissionData] = useState([]);
  const [errorSummary, setErrorSummary] = useState({});
  const [totalPageCount, setTotalPageCount] = useState(1);

  const setTotalCount = useSetRecoilState(transmissionErrorsDetailsCountAtom);

  const onPaginationChange = (pagination: any) => {
    setPagination(pagination);
  };

  const computeQueryResponse = (successData: { summary: any; data: any; pagination: any }, error: any) => {
    if (error) {
      computeError();
      return;
    }
    computeSuccess(successData);
  };

  const computeSuccess = (successData: { summary: any; data: any; pagination: any }) => {
    calculatePageCount(successData?.pagination);
    setTransmissionData(successData?.data ?? []);
    setErrorSummary(successData?.summary ?? {});
  };

  const computeError = () => {
    setTransmissionData([]);
  };

  const calculatePageCount = (paginationResult: { limit: number; total: number }) => {
    if (!paginationResult) {
      setTotalCount(0);
      return;
    }

    const { limit, total } = paginationResult;
    setTotalCount(total);
    setTotalPageCount(Math.ceil(total / limit));
  };

  const { data, error, isFetching } = useQuery({
    queryKey: ["transmissions-details", pagination],
    queryFn: () =>
      _get(`/api/v1/organismes/${props.organisme._id}/transmission/${props.date}/error`, {
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
    <>
      <TransmissionsErrorSummary summary={errorSummary} isLoading={isFetching} />
      <Box mt={10} mb={10}>
        <Text>Cliquez sur une ligne d’apprenant pour identifier les données en erreur.</Text>
      </Box>
      <TransmissionErrorDetailsTable
        onPaginationChange={onPaginationChange}
        pagination={pagination}
        organisme={props.organisme}
        date={props.date}
        transmissionData={transmissionData}
        isFetching={isFetching}
        totalPageCount={totalPageCount}
      ></TransmissionErrorDetailsTable>
    </>
  );
};

export default TransmissionsErrorTab;
