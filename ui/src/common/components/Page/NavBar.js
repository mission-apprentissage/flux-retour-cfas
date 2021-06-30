import { Box, Button, HStack, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { NavLink, useHistory, useRouteMatch } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { isUserAdmin } from "../../utils/rolesUtils";
import Section from "../Section/Section";

const NavItem = ({ to, children }) => {
  const isActive = useRouteMatch({
    path: to,
    exact: true,
  });

  return (
    <Link
      paddingY="3w"
      paddingX="3v"
      as={NavLink}
      to={to}
      color={isActive ? "bluefrance" : "grey.800"}
      _hover={{ textDecoration: "none", color: "grey.800", bg: "galt" }}
      borderBottom="3px solid"
      borderColor={isActive ? "bluefrance" : "transparent"}
    >
      {children}
    </Link>
  );
};

NavItem.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const NavBar = () => {
  const [auth, setAuth] = useAuth();
  const history = useHistory();
  const logout = () => {
    setAuth(null);
    history.push("/login");
  };

  const isAdmin = isUserAdmin(auth);

  return (
    <Section>
      <HStack as="nav" spacing="2w" alignItems="center">
        <NavItem to="/tableau-de-bord">Indices en temps réel</NavItem>
        {isAdmin && (
          <>
            <NavItem to="/stats">Statistiques Globales</NavItem>
            <NavItem to="/stats/ymag">Statistiques Ymag</NavItem>
            <NavItem to="/stats/gesti">Statistiques Gesti</NavItem>
            <NavItem to="/referentiel-cfas">Organismes par région</NavItem>
            <Box paddingY="3w" paddingX="3v">
              <Button
                variant="unstyled"
                color="grey.800"
                height="100%"
                _hover={{ textDecoration: "underline" }}
                onClick={logout}
              >
                Déconnexion
              </Button>
            </Box>
          </>
        )}
      </HStack>
    </Section>
  );
};

export default NavBar;
