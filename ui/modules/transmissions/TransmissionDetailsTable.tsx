import { Text, Button } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AccessorKeyColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear, formatDateHourMinutesSecondsMs } from "@/common/utils/dateUtils";
import EffectifQueueItemView from "@/components/Effectif/EffectifQueueItemView";
import EffectifStatutTag from "@/components/Effectif/EffectifStatusTag";
import TableWithPagination from "@/components/Table/TableWithPagination";
import { transmissionDetailsCountAtom } from "@/hooks/tranmissions";
import { AddFill, SubtractLine } from "@/theme/components/icons";

// const ErreurDisplayComponent = ({ effectif }) => {
//   const errors = effectif.validation_errors;
//   const id = effectif._id;
//   return errors && errors.length ? (
//     errors.map(({ message, path }, index) => {
//       return (
//         <SimpleGrid columns={2} key={`${id}-${index}`} padding={2}>
//           <Box>
//             <Flex>{message}</Flex>
//           </Box>
//           <Box>
//             <Flex flexDirection="column" pl={10}>
//               <Box>
//                 {path.map((v) => (
//                   <Text key={`${id}-${message}`}>
//                     {v} : {effectif[v] ?? <i>null</i>}
//                   </Text>
//                 ))}
//               </Box>
//             </Flex>
//           </Box>
//         </SimpleGrid>
//       );
//     })
//   ) : (
//     <Box padding={2}>
//       <Text>
//         <i>Erreur inconnue</i>
//       </Text>
//     </Box>
//   );
// };

const transmissionByDayColumnDefs: AccessorKeyColumnDef<any, any>[] = [
  {
    size: 300,
    header: () => "Apprenant",
    accessorKey: "apprenant",
    cell: ({ row }) => (
      <Text fontSize="1rem" padding={1}>{`${row.original.prenom_apprenant} ${row.original.nom_apprenant}`}</Text>
    ),
  },
  {
    size: 200,
    header: () => "Date de naissance",
    accessorKey: "birthdate",
    cell: ({ row }) => (
      <Text fontSize="1rem">{formatDateNumericDayMonthYear(row.original.date_de_naissance_apprenant)}</Text>
    ),
  },
  {
    size: 200,
    header: () => "Statut",
    accessorKey: "status",
    cell: ({ row }) => <EffectifStatutTag nature={row.original.statut_apprenant} />,
  },
  {
    size: 200,
    header: () => "Code Diplôme",
    accessorKey: "code_diplome",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.formation_cfd}</Text>,
  },
  {
    size: 200,
    header: () => "RNCP",
    accessorKey: "code_rncp",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.formation_rncp}</Text>,
  },
  {
    size: 200,
    header: () => "Heure d'envoi",
    accessorKey: "processed_at",
    cell: ({ row }) => <Text fontSize="1rem">{formatDateHourMinutesSecondsMs(row.original.processed_at)}</Text>,
  },
  {
    size: 100,
    header: () => "Erreurs",
    accessorKey: "errors",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.validation_errors?.length}</Text>,
  },
  {
    size: 100,
    header: () => "",
    accessorKey: "expander",
    cell: ({ row, table }) => {
      return row.getCanExpand() ? (
        <Button
          pl={0}
          pr={0}
          h={8}
          w={8}
          minW={8}
          onClick={() => {
            if (table.getIsSomeRowsExpanded() && !row.getIsExpanded()) table.resetExpanded();
            row.toggleExpanded();
          }}
          cursor="pointer"
        >
          {row.getIsExpanded() ? (
            <SubtractLine fontSize="12px" color="bluefrance" />
          ) : (
            <AddFill fontSize="12px" color="bluefrance" />
          )}
        </Button>
      ) : null;
    },
  },
  // {
  //   size: 600,
  //   header: () => "Erreur",
  //   accessorKey: "error",
  //   cell: ({ row }) => <ErreurDisplayComponent effectif={row.original} />,
  // },
];

interface TransmissionPageProps {
  organisme: Organisme;
  date: string;
}

const TransmissionDetailsTable = (props: TransmissionPageProps) => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [totalPageCount, setTotalPageCount] = useState(1);
  const [transmissionData, setTransmissionData] = useState([]);
  const setTotalCount = useSetRecoilState(transmissionDetailsCountAtom);

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
      setTotalCount(0);
      return;
    }

    const { limit, total } = paginationResult;
    setTotalCount(total);
    setTotalPageCount(Math.ceil(total / limit));
  };

  const onPageChange = (page: number) => {
    setPagination({ ...pagination, pageIndex: page });
  };

  const onLimitChange = (limit: number) => {
    setPagination({ pageIndex: 0, pageSize: limit });
  };

  const { data, error, isFetching } = useQuery({
    queryKey: ["transmissions-details", pagination],
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
      pageCount={totalPageCount}
      onLimitChange={onLimitChange}
      loading={isFetching}
      isRowExpanded={true}
      renderSubComponent={(row) => <EffectifQueueItemView effectifQueueItem={row.original} />}
    />
  );
};

export default TransmissionDetailsTable;
