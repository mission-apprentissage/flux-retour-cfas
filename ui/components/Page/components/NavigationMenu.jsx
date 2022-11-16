import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Flex,
  Text,
  Menu,
  MenuItem as ChakraMenuItem,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuList,
  Button,
  HStack,
} from "@chakra-ui/react";
import useAuth from "../../../hooks/useAuth";
import { isUserAdmin, hasPageAccessTo } from "../../../common/utils/rolesUtils";
import { MenuFill, Close, AccountFill, AccountUnfill, Parametre } from "../../../theme/components/icons";
import { _get } from "../../../common/httpClient";
import Link from "../../Links/Link";
import MenuItem from "../../../components/Links/MenuItem";

const NavigationMenu = ({ ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <NavBarContainer {...props}>
      <NavToggle toggle={toggle} isOpen={isOpen} />
      <NavLinks isOpen={isOpen} />
    </NavBarContainer>
  );
};

const NavToggle = ({ toggle, isOpen }) => {
  return (
    <Box display={{ base: "block", md: "none" }} onClick={toggle} py={4}>
      {isOpen ? <Close boxSize={8} /> : <MenuFill boxSize={8} />}
    </Box>
  );
};

const NavItem = ({ children, to = "/", ...rest }) => {
  const router = useRouter();
  const isActive = router.pathname === to;

  return (
    <Link
      p={4}
      href={to}
      color={isActive ? "bluefrance" : "grey.800"}
      _hover={{ textDecoration: "none", color: "grey.800", bg: "grey.200" }}
      borderBottom="3px solid"
      borderColor={isActive ? "bluefrance" : "transparent"}
      bg={"transparent"}
    >
      <Text display="block" {...rest}>
        {children}
      </Text>
    </Link>
  );
};

const NavLinks = ({ isOpen }) => {
  let [auth] = useAuth();
  return (
    <Box display={{ base: isOpen ? "block" : "none", md: "block" }} flexBasis={{ base: "100%", md: "auto" }}>
      <Flex
        align="center"
        justify={["center", "space-between", "flex-end", "flex-end"]}
        direction={["column", "row", "row", "row"]}
        pb={[8, 0]}
        textStyle="sm"
      >
        <NavItem to="/">Accueil</NavItem>
        {auth?.sub !== "anonymous" && (
          <>
            {" "}
            <NavItem to="/mes-dossiers/mon-espace">Mon espace</NavItem>
          </>
        )}
      </Flex>
    </Box>
  );
};

const NavBarContainer = ({ children, ...props }) => {
  const boxProps = {
    boxShadow: "md",
  };

  return (
    <Box w="full" {...boxProps}>
      <Container maxW="xl">
        <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" {...props}>
          {children}
        </Flex>
      </Container>
    </Box>
  );
};

export default NavigationMenu;
