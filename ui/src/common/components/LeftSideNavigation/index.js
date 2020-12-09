import { Box, Heading, Link, VStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { Link as RouterLink, useRouteMatch } from "react-router-dom";

import { useAuthState } from "../../auth";
import { isUserAdmin } from "../../utils/rolesUtils";

const NavLink = ({ to, children }) => {
  const match = useRouteMatch({
    path: to,
    exact: true,
  });
  return (
    <Box
      as="li"
      px="2w"
      py="1w"
      borderRadius="4.8rem"
      background={match ? "white" : "initial"}
      boxShadow={match ? "0 0 1rem rgba(0, 0, 0, 0.08)" : ""}
    >
      <Link to={to} as={RouterLink} color="bluefrance" fontSize="epsilon">
        {children}
      </Link>
    </Box>
  );
};

NavLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const LeftSideNavigation = ({ width }) => {
  const [auth] = useAuthState();
  const isAdmin = isUserAdmin(auth);

  return (
    <Box
      height="100%"
      width={width}
      px="4w"
      py="4w"
      position="fixed"
      top="0"
      left="0"
      overflowX="hidden"
      background="bluegrey.100"
      as="nav"
    >
      <VStack as="ul" listStyleType="none" spacing="1w" align="left" mt="2w">
        <NavLink to="/">Accueil</NavLink>
        {isAdmin && (
          <>
            <NavLink to="/stats/gesti">Stats Gesti</NavLink>
            <NavLink to="/stats/ymag">Stats Ymag</NavLink>
          </>
        )}
      </VStack>
      <Heading as="h2" textStyle="h2" fontSize="zeta" fontWeight="400" mt="6w">
        <Box as="i" className="ri-map-pin-fill" marginRight="3v" />
        TERRITOIRE
      </Heading>
      <VStack as="ul" listStyleType="none" spacing="1w" align="left" mt="2w">
        <NavLink to="/etablissements">Établissements</NavLink>
        <NavLink>Départements</NavLink>
        <NavLink>Académies</NavLink>
        <NavLink>Régions académiques</NavLink>
      </VStack>
      <Heading as="h2" textStyle="h2" fontSize="zeta" fontWeight="400" mt="6w">
        TYPE
      </Heading>
      <VStack as="ul" listStyleType="none" spacing="1w" align="left" mt="2w">
        <NavLink>Diplômes</NavLink>
        <NavLink>Spécialités / Secteurs</NavLink>
        <NavLink>Réseaux d&apos;établissements</NavLink>
      </VStack>
    </Box>
  );
};

LeftSideNavigation.propTypes = {
  width: PropTypes.string.isRequired,
};

export default LeftSideNavigation;
