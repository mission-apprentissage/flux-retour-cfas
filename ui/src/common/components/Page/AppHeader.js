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
            Le tableau de bord de l&apos;apprentissage
          </Heading>
          <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
            Mettre à disposition des différents acteurs les données clés de l&apos;apprentissage en temps réel
          </Text>
        </Box>
      </Flex>
    </Section>
  );
};

export default AppHeader;
