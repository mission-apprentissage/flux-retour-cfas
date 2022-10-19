import { Box, Button, Divider, Heading, Input, useDisclosure } from "@chakra-ui/react";
import React, { useState } from "react";

import { BreadcrumbNav, InputLegend, Page, Section } from "../../../common/components";
import Loading from "../../../common/components/Loading/Loading";
import NoResults from "../../../common/components/NoResults/NoResults";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import useReseauCfaSearch, { MINIMUM_CHARS_TO_PERFORM_SEARCH } from "../../../common/hooks/useReseauCfaSearch";
import CreateReseauCfaModal from "./CreateReseauCfaModal";
import ReseauxCfasTable from "./ReseauxCfasTable";

const GestionReseauxCfasPage = () => {
  const createCfaModal = useDisclosure();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, loading } = useReseauCfaSearch(searchTerm);

  return (
    <Page>
      <CreateReseauCfaModal isOpen={createCfaModal.isOpen} onClose={createCfaModal.onClose} />
      <Section backgroundColor="galt" paddingY="3w" withShadow>
        <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.GestionReseauxCfas]} />
        <Heading as="h1" variant="h1" marginBottom="1w" marginTop="4w">
          {NAVIGATION_PAGES.GestionReseauxCfas.title}
        </Heading>
      </Section>
      <Section paddingY="5w" backgroundColor="white" overflowX="scroll">
        <Heading marginBottom="3w">
          Liste des reseaux CFAS
          <Button variant="primary" onClick={createCfaModal.onOpen} marginLeft="2w">
            + Ajouter un CFA à un réseau
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
        {searchTerm.length > 0 && searchResults?.length === 0 && (
          <NoResults title="Il n'y a aucun résultat pour votre recherche sur les reseaux CFAS" />
        )}
        {!loading && <ReseauxCfasTable reseauxCfas={searchResults} />}
      </Section>
    </Page>
  );
};

export default GestionReseauxCfasPage;
