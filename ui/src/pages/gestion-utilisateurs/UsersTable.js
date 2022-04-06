import { Tbody, Td, Tr } from "@chakra-ui/react";
import React from "react";
import { useQuery } from "react-query";

import { fetchUsers } from "../../common/api/tableauDeBord";
import { Table } from "../../common/components";
import { formatDate } from "../../common/utils/dateUtils";
import GetUpdatePasswordUrlButton from "./GetUpdatePasswordUrlButton";

const getUsersListSortedChronologically = (users) => {
  const usersWithoutCreationDate = users.filter((user) => !user.created_at);
  const usersWithCreationDateSorted = users
    .filter((user) => Boolean(user.created_at))
    .sort((a, b) => {
      const date1 = a.created_at ? new Date(a.created_at) : 0;
      const date2 = b.created_at ? new Date(b.created_at) : 0;
      return date2 - date1;
    });
  return [...usersWithCreationDateSorted, ...usersWithoutCreationDate];
};

const UsersTable = () => {
  const { data, isLoading } = useQuery(["users"], () => fetchUsers());
  const usersList = data && getUsersListSortedChronologically(data);

  return (
    <Table
      headers={["Nom d'utilisateur", "Roles", "Email", "Réseau", "Date de création", "Modifier mot de passe"]}
      loading={isLoading}
    >
      <Tbody>
        {usersList?.map((user) => {
          return (
            <Tr key={user.username}>
              <Td color="bluefrance">{user.username}</Td>
              <Td color="grey.800">{user.permissions.join(", ")}</Td>
              <Td color="grey.800">{user.email}</Td>
              <Td color="grey.800">{user.network}</Td>
              <Td color="grey.800">{user.created_at ? formatDate(new Date(user.created_at)) : "Inconnue"}</Td>
              <Td color="grey.800">
                <GetUpdatePasswordUrlButton username={user.username} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default UsersTable;
