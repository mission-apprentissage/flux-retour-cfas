import { Text, Button } from "@chakra-ui/react";
import { AccessorKeyColumnDef } from "@tanstack/react-table";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear, formatDateHourMinutesSecondsMs } from "@/common/utils/dateUtils";
import EffectifQueueItemView from "@/components/Effectif/EffectifQueueItemView";
import EffectifStatutTag from "@/components/Effectif/EffectifStatusTag";
import TableWithPagination from "@/components/Table/TableWithPagination";
import { AddFill, SubtractLine } from "@/theme/components/icons";

const transmissionByDayColumnDefs: AccessorKeyColumnDef<any, any>[] = [
  {
    size: 250,
    header: () => "Apprenant",
    accessorKey: "apprenant",
    cell: ({ row }) => (
      <Text fontSize="1rem" padding={1}>{`${row.original.prenom_apprenant} ${row.original.nom_apprenant}`}</Text>
    ),
  },
  {
    size: 170,
    header: () => "Date de naissance",
    accessorKey: "birthdate",
    cell: ({ row }) => (
      <Text fontSize="1rem">{formatDateNumericDayMonthYear(row.original.date_de_naissance_apprenant)}</Text>
    ),
  },
  {
    size: 130,
    header: () => "Statut",
    accessorKey: "status",
    cell: ({ row }) => <EffectifStatutTag nature={row.original.statut_apprenant} />,
  },
  {
    size: 170,
    header: () => "Code Diplôme",
    accessorKey: "code_diplome",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.formation_cfd}</Text>,
  },
  {
    size: 180,
    header: () => "RNCP",
    accessorKey: "code_rncp",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.formation_rncp}</Text>,
  },
  {
    size: 150,
    header: () => "Heure d'envoi",
    accessorKey: "processed_at",
    cell: ({ row }) => <Text fontSize="1rem">{formatDateHourMinutesSecondsMs(row.original.processed_at)}</Text>,
  },
  {
    size: 80,
    header: () => "Erreurs",
    accessorKey: "errors",
    cell: ({ row }) => <Text fontSize="1rem">{row.original.validation_errors?.length}</Text>,
  },
  {
    size: 70,
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
];

interface TransmissionPageProps {
  organisme: Organisme;
  date: string;
  onPaginationChange: (pagination: any) => void;
  pagination: any;
  transmissionData: any;
  totalPageCount: number;
  isFetching: boolean;
}

const TransmissionDetailsTable = (props: TransmissionPageProps) => {
  const onPageChange = (page: number) => {
    props.onPaginationChange({ ...props.pagination, pageIndex: page });
  };

  const onLimitChange = (limit: number) => {
    props.onPaginationChange({ pageIndex: 0, pageSize: limit });
  };

  return (
    <TableWithPagination
      data={props.transmissionData}
      columns={transmissionByDayColumnDefs}
      onPageChange={(page) => onPageChange(page)}
      paginationState={props.pagination}
      pageCount={props.totalPageCount}
      onLimitChange={onLimitChange}
      loading={props.isFetching}
      isRowExpanded={true}
      renderSubComponent={(row) => <EffectifQueueItemView effectifQueueItem={row.original} />}
    />
  );
};

export default TransmissionDetailsTable;
