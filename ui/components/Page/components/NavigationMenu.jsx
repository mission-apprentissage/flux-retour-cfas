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
      <UserMenu />
    </NavBarContainer>
  );
};

const UserMenu = () => {
  let [auth] = useAuth();

  let logout = async () => {
    const { loggedOut } = await _get("/api/v1/auth/logout");
    if (loggedOut) {
      window.location.href = "/";
    }
  };

  let accountType = auth.roles.length ? auth.roles[0].name : isUserAdmin(auth) ? "admin" : "utilisateur";

  return (
    <>
      {auth?.sub === "anonymous" && (
        <HStack>
          <Link href="/auth/inscription" variant="pill" px={3} py={1}>
            <Text lineHeight={6}>
              <AccountUnfill boxSize={5} mr={2} />
              S&apos;inscrire
            </Text>
          </Link>
          <Link href="/auth/connexion" variant="pill" px={3} py={1}>
            <Text lineHeight={6}>
              <AccountFill boxSize={5} mr={2} />
              Se connecter
            </Text>
          </Link>
        </HStack>
      )}
      {auth?.sub !== "anonymous" && (
        <Menu placement="bottom">
          <MenuButton as={Button} variant="pill">
            <Flex>
              <AccountFill color={"bluefrance"} mt="0.3rem" boxSize={4} />
              <Box display={["none", "block"]} ml={2}>
                <Text color="bluefrance" textStyle="sm">
                  {auth.email}{" "}
                  <Text color="grey.600" as="span">
                    ({accountType})
                  </Text>
                </Text>
              </Box>
            </Flex>
          </MenuButton>
          <MenuList>
            <MenuItem href="/mon-compte" icon={<AccountFill boxSize={4} color={"bluefrance"} />}>
              Mon compte
            </MenuItem>
            {hasPageAccessTo(auth, "admin") && (
              <MenuGroup title="Administration">
                {hasPageAccessTo(auth, "admin/page_gestion_utilisateurs") && (
                  <MenuItem href="/admin/users" icon={<Parametre boxSize={4} />}>
                    Gestion des utilisateurs
                  </MenuItem>
                )}
                {hasPageAccessTo(auth, "admin/page_gestion_roles") && (
                  <MenuItem href="/admin/roles" icon={<Parametre boxSize={4} />}>
                    Gestion des rôles
                  </MenuItem>
                )}
                {hasPageAccessTo(auth, "admin/page_message_maintenance") && (
                  <MenuItem href="/admin/maintenance" icon={<Parametre boxSize={4} />}>
                    Message de maintenance
                  </MenuItem>
                )}
              </MenuGroup>
            )}
            <MenuDivider />
            <ChakraMenuItem onClick={logout}>Déconnexion</ChakraMenuItem>
          </MenuList>
        </Menu>
      )}
    </>
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
