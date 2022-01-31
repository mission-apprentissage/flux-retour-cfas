import { Box, Button, Flex, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { navigationPages } from "../../constants/navigationPages";

const Connect = () => {
  const menuItemHover = {
    color: "bluefrance",
    background: "white",
    fontWeight: "700",
    borderLeft: "2px",
    borderLeftColor: "bluefrance",
  };
  return (
    <Flex alignItems="center">
      <Menu>
        <MenuButton
          as={Button}
          _active={{ color: "bluefrance" }}
          _hover={{ background: "white" }}
          fontSize="zeta"
          variant="link"
          cursor="pointer"
          minWidth={0}
        >
          Connexion
          <Box as="i" marginLeft="3v" className="ri-arrow-down-s-line"></Box>
        </MenuButton>
        <MenuList color="grey.800" rounded="0" padding="2w">
          <MenuItem _hover={menuItemHover} marginTop="2w">
            <NavLink to={navigationPages.Login.path}>
              Vous êtes une institution ou une organisation professionnelle
            </NavLink>
          </MenuItem>

          <MenuItem _hover={menuItemHover} marginTop="2w" marginBottom="4w">
            <NavLink to={navigationPages.TransmettreEtConsulterVosDonnees.path}>
              Vous êtes un organisme de formation en apprentissage
            </NavLink>
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default Connect;
