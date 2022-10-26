import {
  Badge,
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
import PropTypes from "prop-types";
import React from "react";

import { BasePagination } from "../../../../common/components/Pagination/Pagination";
import usePaginatedItems from "../../../../common/hooks/usePaginatedItems";
import GetUpdatePasswordUrlMenuItem from "./menuItems/GetUpdatePasswordUrlMenuItem";

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
          <Th>Email</Th>
          <Th>Role</Th>
          <Th>Nom établissement</Th>
          <Th>Mot de passe</Th>
          <Th>Lien d&apos;activation</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {itemsSliced?.map((user) => {
          return (
            <Tr key={user.id}>
              <Td color="grey.800">{user.email}</Td>
              <Td color="grey.800">{user.role}</Td>
              <Td color="grey.800">{user.nom_etablissement}</Td>
              <Td color="grey.800">
                {user.password_updated_at !== undefined ? (
                  <Badge variant="outline" colorScheme="green">
                    Mis à jour
                  </Badge>
                ) : (
                  <Badge variant="outline" colorScheme="red">
                    Vide
                  </Badge>
                )}
              </Td>
              <Td color="grey.800">
                {user.password_updated_token_at !== undefined ? (
                  <Badge variant="outline" colorScheme="green">
                    Généré
                  </Badge>
                ) : (
                  <Badge variant="outline" colorScheme="red">
                    Vide
                  </Badge>
                )}
              </Td>
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
                    <GetUpdatePasswordUrlMenuItem email={user.email} />
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
