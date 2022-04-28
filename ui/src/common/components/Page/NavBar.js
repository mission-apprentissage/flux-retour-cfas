import { HStack, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { NavLink, useRouteMatch } from "react-router-dom";

import { hasUserRoles, roles } from "../../auth/roles";
import { NAVIGATION_PAGES } from "../../constants/navigationPages";
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
  const isCfa = hasUserRoles(auth, roles.cfa);
  const isAdministrator = hasUserRoles(auth, roles.administrator);
  const isLoggedIn = Boolean(auth?.sub);
  return (
    <Section borderTop="solid 1px" borderTopColor="grey.400">
      <HStack as="nav" spacing="2w" alignItems="center" height="4rem">
        {!isLoggedIn && <NavItem to={NAVIGATION_PAGES.Accueil.path}>Accueil</NavItem>}
        {!isCfa && !isLoggedIn ? (
          <NavItem to={NAVIGATION_PAGES.ExplorerLesIndicateurs.path}>Indicateurs en temps réel</NavItem>
        ) : (
          <NavItem to={NAVIGATION_PAGES.TableauDeBord.path}>Indicateurs en temps réel</NavItem>
        )}
        <NavItem to={NAVIGATION_PAGES.ComprendreLesDonnees.path}>{NAVIGATION_PAGES.ComprendreLesDonnees.title}</NavItem>
        <NavItem to={NAVIGATION_PAGES.JournalDesEvolutions.path}>{NAVIGATION_PAGES.JournalDesEvolutions.title}</NavItem>
        {isAdministrator && isLoggedIn && (
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
