import { HStack, Link } from "@chakra-ui/react";
import NavLink from "next/link";
import PropTypes from "prop-types";
import React from "react";
import { useRouteMatch } from "react-router-dom";

import { hasUserRoles, roles } from "../../common/auth/roles";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import useAuth from "../../hooks/useAuth";
import Section from "../Section/Section";

const NavItem = ({ to, children, exactMatchActive = false }) => {
  const isActive = useRouteMatch({
    path: to,
    exact: exactMatchActive,
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
  exactMatchActive: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

const NavBar = () => {
  const { auth, isAuthTokenValid } = useAuth();
  const isCfa = hasUserRoles(auth, roles.cfa);
  const isAdministrator = hasUserRoles(auth, roles.administrator);
  const isLoggedIn = isAuthTokenValid();
  return (
    <Section borderTop="solid 1px" borderTopColor="grey.400">
      <HStack as="nav" spacing="2w" alignItems="center" height="4rem">
        {!isLoggedIn && (
          <NavItem to={NAVIGATION_PAGES.Accueil.path} exactMatchActive>
            Accueil
          </NavItem>
        )}
        {isCfa || !isLoggedIn ? (
          <NavItem to={NAVIGATION_PAGES.ExplorerLesIndicateurs.path}>Indicateurs en temps réel</NavItem>
        ) : (
          <NavItem to={NAVIGATION_PAGES.VisualiserLesIndicateurs.path}>Indicateurs en temps réel</NavItem>
        )}
        <NavItem to={NAVIGATION_PAGES.ComprendreLesDonnees.path}>{NAVIGATION_PAGES.ComprendreLesDonnees.title}</NavItem>
        <NavItem to={NAVIGATION_PAGES.JournalDesEvolutions.path}>{NAVIGATION_PAGES.JournalDesEvolutions.title}</NavItem>
        {isAdministrator && (
          <>
            <NavItem to={NAVIGATION_PAGES.GestionReseauxCfas.path}>{NAVIGATION_PAGES.GestionReseauxCfas.title}</NavItem>
            <NavItem to={NAVIGATION_PAGES.GestionUtilisateurs.path}>
              {NAVIGATION_PAGES.GestionUtilisateurs.title}
            </NavItem>
          </>
        )}
      </HStack>
    </Section>
  );
};

export default NavBar;
