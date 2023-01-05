import { Box, Button, Divider, Heading, Input, useDisclosure } from "@chakra-ui/react";
import Head from "next/head";
import React, { useState } from "react";

import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
import { Page, InputLegend, Section } from "../../components";
import withAuth from "../../components/withAuth";

import Loading from "../../components/Loading/Loading";
import NoResults from "../../components/NoResults/NoResults";
import useReseauCfaSearch, { MINIMUM_CHARS_TO_PERFORM_SEARCH } from "../../hooks/old/useReseauCfaSearch";
import CreateReseauCfaModal from "../../components/gestion-reseaux-cfas/CreateReseauCfaModal";
import ReseauxCfasTable from "../../components/gestion-reseaux-cfas/ReseauxCfasTable";

const GestionReseauxCfas = () => {
  const createCfaModal = useDisclosure();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, loading } = useReseauCfaSearch(searchTerm);

  const title = "Gestion des reseaux CFAS";

  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />

      <Heading as="h1" mb={8} mt={6}>
        {title}
      </Heading>
      <CreateReseauCfaModal isOpen={createCfaModal.isOpen} onClose={createCfaModal.onClose} />
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

export default withAuth(GestionReseauxCfas, "admin/page_gestion_reseaux_cfa");
