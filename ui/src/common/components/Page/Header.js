import { Box, Divider, Flex, Heading, Link, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { NavLink, useHistory } from "react-router-dom";

import { Padlock } from "../../../theme/components/icons";
import { NAVIGATION_PAGES } from "../../constants/navigationPages";
import { PRODUCT_NAME } from "../../constants/product";
import useAuth from "../../hooks/useAuth";
import Logo from "../Logo/Logo";
import Section from "../Section/Section";

const Header = ({ withText = true }) => {
  const [auth, setAuth] = useAuth();
  const history = useHistory();
  const isLoggedIn = Boolean(auth?.sub);

  const logout = () => {
    setAuth(null);
    history.push(NAVIGATION_PAGES.Accueil.path);
  };

  return (
    <Section as="header">
      <Flex justifyContent="space-between">
        <Flex padding="2" alignItems="center">
          <Logo />
          {withText && (
            <Box marginLeft="5w">
              <Heading as="h1" variant="h1" fontSize="gamma">
                Le {PRODUCT_NAME}{" "}
              </Heading>
              <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
                Mettre à disposition des différents acteurs les données clés de l&apos;apprentissage en temps réel
              </Text>
            </Box>
          )}
        </Flex>
        <Flex alignItems="center">
          <Link variant="link" as={NavLink} to={NAVIGATION_PAGES.OrganismeFormation.path}>
            Organisme de formation
          </Link>
          <Divider
            height="22px"
            width="1px"
            marginTop="2px"
            marginLeft="1w"
            marginRight="1v"
            orientation="vertical"
            verticalAlign="middle"
            backgroundColor="#EFEFEF"
          />
          {isLoggedIn === true ? (
            <Link
              variant="link"
              onClick={logout}
              padding="3v"
              margin="1v"
              borderRadius="20px"
              _hover={{ bg: "#EFEFEF" }}
            >
              Déconnexion
              <Box as="i" marginLeft="3v" className="ri-logout-box-r-line" />
            </Link>
          ) : (
            <Link variant="link" to={NAVIGATION_PAGES.Login.path} as={NavLink}>
              <Padlock color="bluefrance" marginTop="-3px" h="12px" w="12px" marginRight="1w" /> Connexion
            </Link>
          )}
        </Flex>
      </Flex>
    </Section>
  );
};

Header.propTypes = {
  withText: PropTypes.bool,
};

export default Header;
