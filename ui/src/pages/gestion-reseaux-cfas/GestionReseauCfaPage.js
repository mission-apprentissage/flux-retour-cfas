import { Button, Heading, useDisclosure } from "@chakra-ui/react";
import React from "react";

import { Footer, Header, Section } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import CreateReseauCfaModal from "./CreateReseauCfaModal";
import ReseauxCfasTable from "./ReseauxCfasTable";

const GestionReseauxCfasPage = () => {
  const createCfaModal = useDisclosure();

  return (
    <>
      <CreateReseauCfaModal isOpen={createCfaModal.isOpen} onClose={createCfaModal.onClose} />
      <Header />
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
        <ReseauxCfasTable />
      </Section>
      <Footer />
    </>
  );
};

export default GestionReseauxCfasPage;
