import { Box, Heading, HStack, Link, Text, useDisclosure } from "@chakra-ui/react";
import React from "react";

import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { BreadcrumbNav, Page, Section } from "../../components";
import { Padlock } from "../../theme/components/icons";
import LoginModal from "../login_/LoginModal.jsx";
import ApercuDonneesNational from "./ApercuDonneesNational";

const ExplorerLesIndicateursPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Page>
      <Section withShadow backgroundColor="galt" paddingY="2w" color="grey.800">
        <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.ExplorerLesIndicateurs]} />
        <Heading as="h1" variant="h1" marginTop="1w">
          Visualiser les indicateurs en temps réel
        </Heading>
        <HStack fontSize="epsilon" spacing="2w" paddingY="2w">
          <Box>
            <Padlock color="bluefrance" marginTop="-1w" flex="1" width="18px" height="20px" />
            <Text as="span" marginLeft="1w">
              Merci de vous connecter pour consulter l’intégralité des données.
            </Text>
          </Box>
          <Box color="bluefrance" flex="2">
            <Link variant="link" fontSize="epsilon" onClick={onOpen}>
              <Box as="span" verticalAlign="middle">
                Connexion
              </Box>
              <Box as="i" className="ri-arrow-right-line" marginLeft="1w" verticalAlign="middle" />
            </Link>
            <LoginModal isOpen={isOpen} onClose={onClose} />
          </Box>
        </HStack>
      </Section>
      <ApercuDonneesNational />
    </Page>
  );
};

export default ExplorerLesIndicateursPage;
