import React from "react";
import { Flex, HStack, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { NotificationFill } from "../../../../theme/components/icons";
import ItemContent from "./ItemContent";

export function NotificationsMenu(props) {
  return (
    <Menu placement="bottom">
      <MenuButton {...props}>
        <HStack>
          <NotificationFill boxSize={4} color="bluefrance" />
        </HStack>
      </MenuButton>
      <MenuList p="16px 8px">
        <Flex flexDirection="column">
          <MenuItem borderRadius="8px" mb="10px">
            <ItemContent time="13 minutes ago" info="from Alicia" boldInfo="Nouveau partage" aName="Alicia" />
          </MenuItem>
          <MenuItem borderRadius="8px" mb="10px">
            <ItemContent time="2 days ago" boldInfo="Nouveau organisme dans votre reseau" aName="Josh Henry" />
          </MenuItem>
          <MenuItem borderRadius="8px">
            <ItemContent time="3 days ago" info="" boldInfo="Sifa 2023" aName="Kara" />
          </MenuItem>
        </Flex>
      </MenuList>
    </Menu>
  );
}
