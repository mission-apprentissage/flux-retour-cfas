import { Text } from "@chakra-ui/react";
import { type IUsersMigrationJson } from "shared";

import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import NewTable from "@/modules/indicateurs/NewTable";

type UsersListInfoProps = {
  users: null | IUsersMigrationJson[];
};

export function UsersList({ users }: UsersListInfoProps) {
  return (
    <NewTable
      data={users ?? []}
      columns={[
        {
          header: "Nom",
          accessorKey: "nom",
        },
        {
          header: "Prénom",
          accessorKey: "prenom",
        },
        {
          header: "Email",
          accessorKey: "email",
        },
        {
          header: "Téléphone",
          accessorKey: "telephone",
        },
        {
          header: "Fonction",
          accessorKey: "fonction",
        },
        {
          header: "Statut du compte",
          accessorKey: "account_status",
        },
        {
          header: "Date de création",
          accessorKey: "created_at",
          cell: ({ row }) => (
            <Text>{row.original.created_at ? formatDateDayMonthYear(row.original.created_at) : ""}</Text>
          ),
        },
        {
          header: "Dernière connection",
          accessorKey: "last_connection",
          cell: ({ row }) => (
            <Text>{row.original.last_connection ? formatDateDayMonthYear(row.original.last_connection) : ""}</Text>
          ),
        },
      ]}
    />
  );
}
