import { Box, Flex, Link, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
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
    <Link to={to} as={RouterLink} color="bluefrance" fontSize="epsilon" fontWeight={match ? "700" : "400"}>
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
  const isAdmin = isUserAdmin(auth);

  return (
    <Menu>
      <MenuButton>
        <Flex alignItems="center">
          <Box fontSize="beta" as="i" className="ri-account-circle-fill" marginRight="1w" />
          <span>{auth.sub}</span>
          <Box fontSize="beta" as="i" className="ri-arrow-down-s-line" marginLeft="1w" />
        </Flex>
      </MenuButton>
      <MenuList>
        {isAdmin && (
          <>
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
              <NavLink to="/analytics">Analytics</NavLink>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={logout}>Déconnexion</MenuItem>
      </MenuList>
    </Menu>
  );
};

export default LoggedUserMenu;
