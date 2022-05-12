import { Button, Heading, useDisclosure } from "@chakra-ui/react";
import React from "react";

import { Page, Section } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import CreateUserModal from "./CreateUserModal";
import UsersTable from "./UsersTable";

const GestionUtilisateursPage = () => {
  const createUserModal = useDisclosure();

  return (
    <Page>
      <CreateUserModal isOpen={createUserModal.isOpen} onClose={createUserModal.onClose} />
      <Section backgroundColor="galt" paddingY="8w" withShadow>
        <Heading as="h1" variant="h1" marginBottom="1w">
          {NAVIGATION_PAGES.GestionUtilisateurs.title}
        </Heading>
      </Section>
      <Section paddingY="5w" backgroundColor="white" overflowX="scroll">
        <Heading marginBottom="3w">
          Liste des utilisateurs{" "}
          <Button variant="primary" onClick={createUserModal.onOpen}>
            + Créer un utilisateur
          </Button>
        </Heading>

        <UsersTable />
      </Section>
    </Page>
  );
};

export default GestionUtilisateursPage;
