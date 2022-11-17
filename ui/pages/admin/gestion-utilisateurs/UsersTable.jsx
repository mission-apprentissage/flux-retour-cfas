import {
  Box,
  Button,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  Table,
  TableCaption,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { formatDate } from "../../../common/utils/dateUtils";
import { BasePagination } from "../../../components/Pagination/Pagination";
import usePaginatedItems from "../../../hooks/usePaginatedItems";
import GetUpdatePasswordUrlMenuItem from "./menuItems/GetUpdatePasswordUrlMenuItem";
import RemoveUserMenuItem from "./menuItems/RemoveUserMenuItem";
import UpdateUserMenuItem from "./menuItems/UpdateUserMenuItem";

const UsersTable = ({ users }) => {
  // Pagination hook
  const [current, setCurrent, itemsSliced] = usePaginatedItems(users);

  return (
    <Table variant="secondary">
      <TableCaption>
        <BasePagination
          current={current}
          onChange={(page) => {
            setCurrent(page);
          }}
          total={users?.length}
        />
      </TableCaption>
      <Thead>
        <Tr background="galt">
          <Th>Nom d&apos;utilisateur</Th>
          <Th>Email</Th>
          <Th>Roles</Th>
          <Th>Réseau</Th>
          <Th>Région</Th>
          <Th>Organisme d&apos;appartenance</Th>
          <Th>Date de création</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {itemsSliced?.map((user) => {
          return (
            <Tr key={user.id}>
              <Td color="bluefrance">{user.username}</Td>
              <Td color="grey.800">{user.email}</Td>
              <Td color="grey.800">{user?.permissions?.join(", ")}</Td>
              <Td color="grey.800">{user.network}</Td>
              <Td color="grey.800">{user.region}</Td>
              <Td color="grey.800">{user.organisme}</Td>
              <Td color="grey.800">{user.created_at ? formatDate(new Date(user.created_at)) : "Inconnue"}</Td>
              <Td color="grey.800">
                <Menu>
                  <MenuButton
                    variant="secondary"
                    as={Button}
                    rightIcon={<Box as="i" className="ri-arrow-down-s-fill" />}
                  >
                    Action
                  </MenuButton>
                  <MenuList>
                    <UpdateUserMenuItem userId={user.id} />
                    <GetUpdatePasswordUrlMenuItem username={user.username} />
                    <Divider />
                    <RemoveUserMenuItem username={user.username} />
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

UsersTable.propTypes = {
  users: PropTypes.array,
};
export default UsersTable;
