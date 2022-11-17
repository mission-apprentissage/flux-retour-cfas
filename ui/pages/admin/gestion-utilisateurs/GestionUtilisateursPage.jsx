import { Box, Button, Divider, Heading, Input, useDisclosure } from "@chakra-ui/react";
import React, { useState } from "react";

import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import { InputLegend, Page, Section } from "../../../components";
import Loading from "../../../components/Loading/Loading";
import NoResults from "../../../components/NoResults/NoResults";
import useUsersSearch, { MINIMUM_CHARS_TO_PERFORM_SEARCH } from "../../../hooks/useUsersSearch";
import CreateUserModal from "./createUser/CreateUserModal";
import UsersTable from "./UsersTable";

const GestionUtilisateursPage = () => {
  const createUserModal = useDisclosure();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, loading } = useUsersSearch(searchTerm);

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
        <Input
          marginTop="1w"
          marginBottom="2w"
          width="65%"
          placeholder="Ex : test@email.fr ou DREETS …"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH && (
          <Box paddingLeft="1w">
            <InputLegend>
              Merci de renseigner au minimum {MINIMUM_CHARS_TO_PERFORM_SEARCH} caractères pour lancer la recherche
            </InputLegend>
            <Divider marginTop="3v" borderBottomColor="grey.300" orientation="horizontal" />
          </Box>
        )}
        {loading && <Loading />}
        {searchTerm.length > 0 && searchResults?.length === 0 && (
          <NoResults title="Il n'y a aucun résultat pour votre recherche sur les utilisateurs" />
        )}
        {!loading && <UsersTable users={searchResults} />}
      </Section>
    </Page>
  );
};

export default GestionUtilisateursPage;
