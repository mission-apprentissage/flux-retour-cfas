import { Button, Heading, useDisclosure } from "@chakra-ui/react";
import React from "react";

import { Footer, Header, Section } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import CfasTable from "./CfasTable";
import CreateCfaModal from "./CreateCfaModal";

const GestionCfasPage = () => {
  const createCfaModal = useDisclosure();

  return (
    <>
      <CreateCfaModal isOpen={createCfaModal.isOpen} onClose={createCfaModal.onClose} />
      <Header />
      <Section backgroundColor="galt" paddingY="8w" withShadow>
        <Heading as="h1" variant="h1" marginBottom="1w">
          {NAVIGATION_PAGES.GestionCFAS.title}
        </Heading>
      </Section>
      <Section paddingY="5w" backgroundColor="white" overflowX="scroll">
        <Heading marginBottom="3w">
          Liste des CFAS{" "}
          <Button variant="primary" onClick={createCfaModal.onOpen}>
            + Ajouter un CFA
          </Button>
        </Heading>
        <CfasTable />
      </Section>
      <Footer />
    </>
  );
};

export default GestionCfasPage;
