import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import React from "react";

import Logo from "../Logo/Logo";
import Section from "../Section/Section";

const AppHeader = () => {
  return (
    <Section as="header">
      <Flex alignItems="center">
        <Logo />
        <Box marginLeft="5w">
          <Heading as="h1" variant="h1" fontSize="gamma">
            Données ouvertes de l&apos;apprentissage
          </Heading>
          <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
            Collecter auprès des organismes de formation les données clés pour les mettre à disposition des acteurs de
            l&apos;apprentissage
          </Text>
        </Box>
      </Flex>
    </Section>
  );
};

export default AppHeader;
