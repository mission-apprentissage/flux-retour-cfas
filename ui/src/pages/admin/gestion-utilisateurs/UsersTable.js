import { Box, Button, Table, TableCaption, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import Pagination from "@choc-ui/paginator";
import React, { forwardRef } from "react";
import { useQuery } from "react-query";

import { fetchUsers } from "../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../common/constants/queryKeys";
import { formatDate } from "../../../common/utils/dateUtils";
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

const Prev = forwardRef((props, ref) => (
  <Button ref={ref} {...props}>
    <Box as="i" className="ri-arrow-left-s-line" />
  </Button>
));
const Next = forwardRef((props, ref) => (
  <Button ref={ref} {...props}>
    <Box as="i" className="ri-arrow-right-s-line" />
  </Button>
));

const itemRender = (_, type) => {
  if (type === "prev") {
    return Prev;
  }
  if (type === "next") {
    return Next;
  }
};

Prev.displayName = "prev";
Next.displayName = "next";

const UsersTable = () => {
  const { data } = useQuery([QUERY_KEYS.USERS], () => fetchUsers());
  const usersList = data && getUsersListSortedChronologically(data);
  const [current, setCurrent] = React.useState(1);

  const pageSize = 10;
  const offset = (current - 1) * pageSize;
  const dataSliced = usersList?.slice(offset, offset + pageSize);

  return (
    <Table variant="secondary">
      <TableCaption>
        <Pagination
          current={current}
          onChange={(page) => {
            setCurrent(page);
          }}
          pageSize={pageSize}
          total={usersList?.length}
          itemRender={itemRender}
          paginationProps={{
            display: "flex",
            pos: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          baseStyles={{ bg: "white" }}
          activeStyles={{ bg: "bluefrance", color: "white", pointerEvents: "none" }}
          hoverStyles={{ bg: "galt", color: "grey.800" }}
        />
      </TableCaption>
      <Thead>
        <Tr background="galt">
          <Th>Nom d&apos;utilisateur</Th>
          <Th>Roles</Th>
          <Th>Email</Th>
          <Th>Réseau</Th>
          <Th>Date de création</Th>
          <Th>Modifier mot de passe</Th>
        </Tr>
      </Thead>
      <Tbody>
        {dataSliced?.map((user) => {
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
