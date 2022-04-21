import { Flex, Link, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";

const OrganismeFormationPagesMenu = (props) => {
  return (
    <NavBarContainer {...props}>
      <NavLinks />
    </NavBarContainer>
  );
};

const NavItem = ({ children, to = "/", ...rest }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      padding="1w"
      as={NavLink}
      to={to}
      fontWeight={700}
      color={isActive ? "bluefrance" : "grey.800"}
      _hover={{ textDecoration: "none", color: "grey.800", bg: "grey.200" }}
      borderLeft="2px solid"
      borderColor={isActive ? "bluefrance" : "transparent"}
    >
      <Text display="block" {...rest}>
        {children}
      </Text>
    </Link>
  );
};

NavItem.propTypes = {
  children: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};

const NavLinks = () => {
  return (
    <Flex flexDirection="column">
      <NavItem to={NAVIGATION_PAGES.OrganismeFormation.transmettre.path}>
        Comment transmettre les données de votre organisme ?
      </NavItem>
      <br />
      <NavItem to={NAVIGATION_PAGES.OrganismeFormation.consulter.path}>
        Comment consulter et vérifier les données que vous transmettez ?
      </NavItem>
      <br />
      <NavItem to={NAVIGATION_PAGES.OrganismeFormation.aide.path}>
        Une question ? Besoin d’aide ? Consulter la page d’aide
      </NavItem>
    </Flex>
  );
};

const NavBarContainer = ({ children }) => {
  return (
    <Flex as="nav" flexWrap="wrap">
      {children}
    </Flex>
  );
};

NavBarContainer.propTypes = {
  children: PropTypes.node,
};

export default OrganismeFormationPagesMenu;
