import { Badge, Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import React from "react";

import { PRODUCT_FULL_NAME } from "../../constants/productPartageSimplifie.js";
import useAuth from "../../hooks/useAuth.js";
import LoginButtonPartageSimplifie from "../LoginButtonPartageSimplifie/LoginButtonPartageSimplifie.js";
import Logo from "../Logo/Logo";
import LogoutButton from "../LogoutButton/LogoutButton";
import Section from "../Section/Section";

const HeaderPartageSimplifie = () => {
  const { isAuthTokenValid } = useAuth();
  const displayLogoutButton = isAuthTokenValid();

  return (
    <Section as="header">
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <Logo />
          <Box marginLeft="5w">
            <HStack>
              <Heading fontSize="gamma">{PRODUCT_FULL_NAME}</Heading>
              <Badge
                marginLeft="1"
                borderRadius="4px"
                paddingX="0.5em"
                color="#6E445A"
                fontSize="zeta"
                backgroundColor="#FEE7FC"
              >
                BETA
              </Badge>
            </HStack>

            <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
              Transmettez vos données clés de l&apos;apprentissage aux acteurs de l&apos;apprentissage
            </Text>
          </Box>
        </Flex>
        <HStack justifyContent="space-between">
          {displayLogoutButton ? <LogoutButton /> : <LoginButtonPartageSimplifie />}
        </HStack>
      </Flex>
    </Section>
  );
};

HeaderPartageSimplifie.propTypes = {};

export default HeaderPartageSimplifie;
