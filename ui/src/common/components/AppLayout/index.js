import { Box, Flex, Heading, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useHistory } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import LeftSideNavigation from "../LeftSideNavigation";

const LEFT_SIDE_NAV_WIDTH = "18.25rem";

const AppLayout = ({ children }) => {
  const [auth, setAuth] = useAuth();
  const history = useHistory();
  const logout = () => {
    setAuth(null);
    history.push("/login");
  };

  return (
    <Flex>
      <LeftSideNavigation width={LEFT_SIDE_NAV_WIDTH} />
      <Box marginLeft={LEFT_SIDE_NAV_WIDTH} width="100%" padding="3rem">
        <Flex justifyContent="space-between">
          <Heading fontFamily="Marianne" fontSize="delta" color="grey.800" as="h2">
            Dashboard de l&apos;apprentissage
          </Heading>
          <Menu>
            <MenuButton>
              <Flex alignItems="center">
                <Box fontSize="beta" as="i" className="ri-account-circle-fill" marginRight="1w" />
                <span>{auth.sub}</span>
                <Box fontSize="beta" as="i" className="ri-arrow-down-s-line" marginLeft="1w" />
              </Flex>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={logout}>Déconnexion</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        {children}
      </Box>
    </Flex>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppLayout;
