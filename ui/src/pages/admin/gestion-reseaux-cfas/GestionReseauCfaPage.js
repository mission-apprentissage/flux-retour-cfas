import { Box, Button, Divider, Heading, Input, Skeleton, Stack, Text, useDisclosure } from "@chakra-ui/react";
import React, { useState } from "react";

import { InputLegend, Page, Section } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import CreateReseauCfaModal from "./CreateReseauCfaModal";
import ReseauxCfasTable from "./ReseauxCfasTable";
import useReseauCfaSearch, { MINIMUM_CHARS_TO_PERFORM_SEARCH } from "./useReseauCfaSearch";

const Loading = () => {
  return (
    <Stack spacing="2w" paddingLeft="1w" marginTop="2w">
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
    </Stack>
  );
};

const NoResults = () => {
  return (
    <Text color="grey.800" fontWeight="700" paddingTop="2w" paddingLeft="1w">
      Il n&apos;y a aucun résultat pour votre recherche sur les reseaux CFAS
    </Text>
  );
};

const GestionReseauxCfasPage = () => {
  const createCfaModal = useDisclosure();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, loading } = useReseauCfaSearch(searchTerm);

  return (
    <Page>
      <CreateReseauCfaModal isOpen={createCfaModal.isOpen} onClose={createCfaModal.onClose} />
      <Section backgroundColor="galt" paddingY="8w" withShadow>
        <Heading as="h1" variant="h1" marginBottom="1w">
          {NAVIGATION_PAGES.GestionReseauxCfas.title}
        </Heading>
      </Section>
      <Section paddingY="5w" backgroundColor="white" overflowX="scroll">
        <Heading marginBottom="3w">
          Liste des reseaux CFAS{" "}
          <Button variant="primary" onClick={createCfaModal.onOpen}>
            + Ajouter un CFA
          </Button>
        </Heading>
        <Input
          marginTop="1w"
          marginBottom="2w"
          width="65%"
          placeholder="Ex : 0394889D ou UFA …"
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
        {searchTerm.length > 0 && searchResults?.length === 0 && <NoResults />}
        <ReseauxCfasTable reseauxCfas={searchResults} />
      </Section>
    </Page>
  );
};

export default GestionReseauxCfasPage;
