import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import BetaDisclaimer from "../BetaDisclaimer/BetaDisclaimer";
import Logo from "../Logo/Logo";
import Section from "../Section/Section";
import NavBar from "./NavBar";

const Page = ({ children }) => {
  return (
    <>
      <AppHeader />
      <NavBar />
      {children}
      <BetaDisclaimer />
    </>
  );
};

const AppHeader = () => {
  return (
    <Section as="header" borderBottom="solid 1px" borderBottomColor="grey.400" paddingY="3w">
      <Flex alignItems="center">
        <Logo />
        <Box marginLeft="5w">
          <Heading as="h1" fontWeight="700" fontFamily="Marianne" color="grey.800" fontSize="gamma">
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

Page.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Page;
