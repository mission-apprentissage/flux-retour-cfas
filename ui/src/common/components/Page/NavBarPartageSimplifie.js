import { HStack, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { NavLink, useRouteMatch } from "react-router-dom";

import { NAVIGATION_PAGES } from "../../constants/navigationPages";
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

const NavBarPartageSimplifie = () => {
  return (
    <Section borderTop="solid 1px" borderTopColor="grey.400">
      <HStack as="nav" spacing="2w" alignItems="center" height="4rem">
        <NavItem to={NAVIGATION_PAGES.GestionUtilisateurs.path}>{NAVIGATION_PAGES.GestionUtilisateurs.title}</NavItem>
      </HStack>
    </Section>
  );
};

export default NavBarPartageSimplifie;
