import { Box, Divider, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";
import NavLink from "next/link";
import React from "react";

import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { PRODUCT_NAME } from "../../common/constants/product";
import useAuth from "../../hooks/useAuth";
import LoginButton from "../LoginButton/LoginButton";
import Logo from "../Logo/Logo";
import LogoutButton from "../LogoutButton/LogoutButton";
import Section from "../Section/Section";

const Header = () => {
  const { isAuthTokenValid } = useAuth();
  const displayLogoutButton = isAuthTokenValid();

  return (
    <Section as="header">
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <Logo />
          <Box marginLeft="5w">
            <Heading as="h1" variant="h1" fontSize="gamma">
              Le {PRODUCT_NAME}{" "}
            </Heading>
            <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
              Mettre à disposition des différents acteurs les données clés de l&apos;apprentissage en temps réel
            </Text>
          </Box>
        </Flex>
        <HStack justifyContent="space-between">
          <Link variant="link" as={NavLink} to={NAVIGATION_PAGES.OrganismeFormation.path}>
            Organisme de formation
          </Link>
          <Divider height="22px" width="1px" orientation="vertical" backgroundColor="#EFEFEF" />
          {displayLogoutButton ? <LogoutButton /> : <LoginButton />}
        </HStack>
      </Flex>
    </Section>
  );
};

Header.propTypes = {};

export default Header;
