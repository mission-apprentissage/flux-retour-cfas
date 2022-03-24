import { Button, Heading, Tbody, Td, Tr, useDisclosure } from "@chakra-ui/react";
import React from "react";
import { useQuery } from "react-query";

import { fetchUsers } from "../../common/api/tableauDeBord";
import { Footer, Header, Section, Table } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import CreateUserModal from "./CreateUserModal";

const GestionUtilisateursPage = () => {
  const { data, isLoading } = useQuery(["users"], () => fetchUsers());
  const createUserModal = useDisclosure();

  return (
    <>
      <CreateUserModal isOpen={createUserModal.isOpen} onClose={createUserModal.onClose} />
      <Header />
      <Section backgroundColor="galt" paddingY="8w" withShadow>
        <Heading as="h1" variant="h1" marginBottom="1w">
          {NAVIGATION_PAGES.GestionUtilisateurs.title}
        </Heading>
      </Section>
      <Section paddingY="5w" backgroundColor="white">
        <Heading marginBottom="3w">
          Liste des utilisateurs{" "}
          <Button variant="primary" onClick={createUserModal.onOpen}>
            + Créer un utilisateur
          </Button>
        </Heading>

        <Table headers={["Nom d'utilisateur", "Roles", "Email", "Réseau"]} loading={isLoading}>
          <Tbody>
            {data?.map((user) => {
              return (
                <Tr key={user.username}>
                  <Td color="bluefrance">{user.username}</Td>
                  <Td color="grey.800">{user.permissions.join(", ")}</Td>
                  <Td color="grey.800">{user.email}</Td>
                  <Td color="grey.800">{user.network}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Section>
      <Footer />
    </>
  );
};

export default GestionUtilisateursPage;
