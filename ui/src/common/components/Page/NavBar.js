import { HStack, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { NavLink, useRouteMatch } from "react-router-dom";

import { hasUserRoles, roles } from "../../auth/roles";
import useAuth from "../../hooks/useAuth";
import Section from "../Section/Section";

const NavItem = ({ to, children }) => {
  const isActive = useRouteMatch({
    path: to,
    exact: true,
  });

  return (
    <Link
      height="100%"
      display="flex"
      alignItems="center"
      paddingX="3v"
      as={NavLink}
      to={to}
      fontSize="zeta"
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
  const [auth] = useAuth();
  console.log(auth);
  const isAdmin = hasUserRoles(auth, roles.administrator);
  const isCfa = hasUserRoles(auth, roles.cfa);

  return (
    <Section borderTop="solid 1px" borderTopColor="grey.400">
      <HStack as="nav" spacing="2w" alignItems="center" height="4rem">
        {!isCfa && <NavItem to="/tableau-de-bord">Indices en temps réel</NavItem>}
        <NavItem to="/comprendre-donnees">Comprendre les données</NavItem>

        {isAdmin && (
          <>
            <NavItem to="/stats">Statistiques Globales</NavItem>
            <NavItem to="/stats/ymag">Statistiques Ymag</NavItem>
            <NavItem to="/stats/gesti">Statistiques Gesti</NavItem>
          </>
        )}
      </HStack>
    </Section>
  );
};

export default NavBar;
