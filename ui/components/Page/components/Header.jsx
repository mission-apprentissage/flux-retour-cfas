import React from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem as ChakraMenuItem,
  MenuItem,
  MenuList,
  Tag,
  Text,
} from "@chakra-ui/react";
import { Logo } from "./Logo";
import Link from "../../Links/Link";
import { PRODUCT_NAME } from "../../../common/constants/product";
import { AccountUnfill } from "../../../theme/components/icons/AccountUnfill.jsx";
import { AccountFill } from "../../../theme/components/icons/AccountFill.jsx";
import useAuth from "../../../hooks/useAuth.js";
import { hasPageAccessTo, isUserAdmin } from "../../../common/utils/rolesUtils.js";
import { _get } from "../../../common/httpClient.js";
import { Parametre } from "../../../theme/components/icons/Parametre.js";

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
    <Box mb={["3w", "3w", "0", "0"]}>
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
    </Box>
  );
};

const Header = () => {
  return (
    <Container maxW={"full"} borderBottom={"1px solid"} borderColor={"grey.400"} px={[0, 4]} as="header">
      <Container maxW="xl" py={[0, 2]} px={[0, 4]}>
        <Flex flexDirection={["column", "column", "column", "row"]} alignItems="center" color="grey.800">
          {/* Logo */}
          <Link href="/" p={[4, 0]}>
            <Logo />
          </Link>
          <Box mt={["2w", "2w", "0"]} marginLeft="5w" textAlign={["center", "center", "initial"]}>
            <Heading as="h6" variant="h1" fontSize="gamma">
              Le {PRODUCT_NAME}{" "}
            </Heading>
            <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
              Mettre à disposition des différents acteurs les données clés de l&apos;apprentissage en temps réel
            </Text>
          </Box>
          <Box flex="1" my={["2w", "2w", "0"]}>
            <Tag marginBottom="1w" backgroundColor="bluefrance" color="white" ml="5">
              Beta-V1
            </Tag>
          </Box>
          <UserMenu />
        </Flex>
      </Container>
    </Container>
  );
};

export default Header;
