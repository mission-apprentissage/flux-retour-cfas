import { Box, Flex, Heading, Tag, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import useAuth from "../../hooks/useAuth";
import Logo from "../Logo/Logo";
import Section from "../Section/Section";
import Connect from "./Connect";
import Disconnect from "./Disconnect";

const Header = ({ withText = true }) => {
  const [auth] = useAuth();
  const isLoggedIn = Boolean(auth?.sub);

  return (
    <Section as="header">
      <Flex justifyContent="space-between">
        <Flex p="2" alignItems="center">
          <Logo />
          {withText && (
            <Box marginLeft="5w">
              <Heading as="h1" variant="h1" fontSize="gamma">
                Le tableau de bord de l&apos;apprentissage{" "}
                <Tag marginBottom="1w" bgColor="bluefrance" color="white">
                  beta
                </Tag>
              </Heading>
              <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
                Mettre à disposition des différents acteurs les données clés de l&apos;apprentissage en temps réel
              </Text>
            </Box>
          )}
        </Flex>
        <Flex alignItems="center">{isLoggedIn === true ? <Disconnect /> : <Connect />}</Flex>
      </Flex>
    </Section>
  );
};

Header.propTypes = {
  withText: PropTypes.bool,
};

export default Header;
