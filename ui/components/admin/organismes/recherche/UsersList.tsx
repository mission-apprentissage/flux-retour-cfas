import { Text } from "@chakra-ui/react";
import { OrganismeSupportInfoJson } from "shared";

import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import NewTable from "@/modules/indicateurs/NewTable";

type UsersListInfoProps = {
  organisation: null | OrganismeSupportInfoJson["organisation"];
};

export function UsersList({ organisation }: UsersListInfoProps) {
  return (
    <NewTable
      data={organisation?.users ?? []}
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
