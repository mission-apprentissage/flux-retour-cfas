import { Box, Button, Heading, Text, useDisclosure } from "@chakra-ui/react";
import React from "react";

import { AppHeader, Footer, Section } from "../../../common/components";
import BreadcrumbNav from "../../../common/components/BreadcrumbNav/BreadcrumbNav";
import { navigationPages } from "../../../common/constants/navigationPages";
import AskAccessLinkModal from "./AskAccessLink/AskAccessLinkModal";

const ConsulterVosDonneesPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <AppHeader />
      <Section backgroundColor="galt" paddingY="4w" boxShadow="inset 0px 12px 12px 0px rgba(30, 30, 30, 0.06)">
        <Box width="500px">
          <BreadcrumbNav
            links={[
              navigationPages.Accueil,
              navigationPages.TransmettreEtConsulterVosDonnees,
              navigationPages.ConsulterVosDonnees,
            ]}
          />
          <Heading paddingTop="5w" as="h1" variant="h1" marginBottom="1w">
            {navigationPages.ConsulterVosDonnees.title}
          </Heading>
          <Text marginBottom="2w" color="black">
            Vous transmettez déja vos données au tableau de bord,&nbsp;
            <strong>utilisez votre lien d&apos;accès pour consulter la page de votre organisme de formation</strong>
          </Text>
          <Button type="submit" variant="ghost" onClick={onOpen}>
            Demander votre lien d&apos;accès
          </Button>
          <AskAccessLinkModal isOpen={isOpen} onClose={onClose} />
        </Box>
      </Section>
      <Footer />
    </>
  );
};

export default ConsulterVosDonneesPage;
