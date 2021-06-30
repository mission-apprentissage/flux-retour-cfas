import { Box, HStack, Link, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { Link as RouterLink, useHistory, useRouteMatch } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { isUserAdmin } from "../../utils/rolesUtils";

const NavLink = ({ to, children }) => {
  const match = useRouteMatch({
    path: to,
    exact: true,
  });
  return (
    <Link to={to} as={RouterLink} color="grey.800" fontSize="epsilon" fontWeight={match ? "700" : "400"}>
      {children}
    </Link>
  );
};

NavLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const LoggedUserMenu = () => {
  const [auth, setAuth] = useAuth();
  const history = useHistory();
  const logout = () => {
    setAuth(null);
    history.push("/login");
  };

  if (!auth) {
    return null;
  }

  const isAdmin = isUserAdmin(auth);

  return (
    <Menu>
      <MenuButton>
        <HStack alignItems="center" spacing="1w">
          <Box fontSize="beta" as="i" className="ri-account-circle-fill" />
          <span>{auth.sub}</span>
          <Box fontSize="beta" as="i" className="ri-arrow-down-s-line" />
        </HStack>
      </MenuButton>
      <MenuList>
        {isAdmin && (
          <>
            <MenuItem>
              <NavLink to="/tableau-de-bord/">Tableau de bord</NavLink>
            </MenuItem>
            <MenuItem>
              <NavLink to="/stats">Statistiques globales</NavLink>
            </MenuItem>
            <MenuItem>
              <NavLink to="/stats/gesti">Statistiques Gesti</NavLink>
            </MenuItem>
            <MenuItem>
              <NavLink to="/stats/ymag">Statistiques Ymag</NavLink>
            </MenuItem>
            <MenuItem>
              <NavLink to="/referentiel-cfas">Organismes de formation par région</NavLink>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={logout}>Déconnexion</MenuItem>
      </MenuList>
    </Menu>
  );
};

export default LoggedUserMenu;
