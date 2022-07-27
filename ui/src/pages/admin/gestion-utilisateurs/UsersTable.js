import {
  Box,
  Button,
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
import Pagination from "@choc-ui/paginator";
import PropTypes from "prop-types";
import React, { forwardRef } from "react";

import { formatDate } from "../../../common/utils/dateUtils";
import GetUpdatePasswordUrlMenuItem from "./menuItems/GetUpdatePasswordUrlMenuItem";
import RemoveUserMenuItem from "./menuItems/RemoveUserMenuItem";

const UsersTable = ({ users }) => {
  const [current, setCurrent] = React.useState(1);

  const pageSize = 10;
  const offset = (current - 1) * pageSize;
  const usersSliced = users?.slice(offset, offset + pageSize);

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

  return (
    <Table variant="secondary">
      <TableCaption>
        <Pagination
          current={current}
          onChange={(page) => {
            setCurrent(page);
          }}
          pageSize={pageSize}
          total={users?.length}
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
        {usersSliced?.map((user) => {
          return (
            <Tr key={user.username}>
              <Td color="bluefrance">{user.username}</Td>
              <Td color="grey.800">{user.email}</Td>
              <Td color="grey.800">{user.permissions.join(", ")}</Td>
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
                    <GetUpdatePasswordUrlMenuItem username={user.username} />
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
