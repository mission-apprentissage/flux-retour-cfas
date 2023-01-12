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
  MenuList,
  MenuItem as ChakraMenuItem,
  Tag,
  Text,
  // Skeleton,
} from "@chakra-ui/react";
import { Logo } from "./Logo";
import Link from "../../Links/Link";
import { PRODUCT_NAME } from "../../../common/constants/product";
import { AccountUnfill } from "../../../theme/components/icons/AccountUnfill.jsx";
import { AccountFill } from "../../../theme/components/icons/AccountFill.jsx";
import useAuth from "../../../hooks/useAuth.js";
import { hasPageAccessTo } from "../../../common/utils/rolesUtils.js";
import { _get } from "../../../common/httpClient.js";
import MenuItem from "../../Links/MenuItem";
import { Parametre } from "../../../theme/components/icons/Parametre.js";
import { Settings4Fill, UserFill } from "../../../theme/components/icons";
import { useRouter } from "next/router";
// import { NotificationsMenu } from "./Notifications/Notifications";

const UserMenu = () => {
  let [auth] = useAuth();
  const router = useRouter();

  let logout = async () => {
    const { loggedOut } = await _get("/api/v1/auth/logout");
    if (loggedOut) {
      window.location.href = "/";
    }
  };

  const myWks =
    (router.pathname.includes("/mon-espace") || router.pathname.includes("/organisme")) && auth?.sub !== "anonymous";

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
        <Flex w="full">
          {/* <NotificationsMenu mr={5} w="15px" /> */}
          <Link
            href="/mon-espace/mon-organisme"
            borderBottom="1px solid"
            borderColor={myWks ? "bluefrance" : "transparent"}
            color={myWks ? "bluefrance" : "grey.800"}
            mr={5}
            variant="summary"
            w="97px"
          >
            Mon espace
          </Link>
          <Menu placement="bottom">
            <MenuButton as={Button} variant="pill" px={0} flexGrow={1}>
              <Flex maxWidth="226px">
                <UserFill mt="0.3rem" boxSize={4} />
                <Box display={["none", "block"]} ml={2}>
                  <Text color="bluefrance" textStyle="sm" textOverflow="ellipsis" maxWidth="200px" overflow="hidden">
                    {auth.email}
                  </Text>
                </Box>
              </Flex>
            </MenuButton>
            <MenuList>
              <MenuItem href="/mon-compte" icon={<Settings4Fill boxSize={4} color={"bluefrance"} />}>
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
        </Flex>
      )}
    </>
  );
};

const Header = ({ espaceContextisLoading }) => {
  return (
    <Container maxW={"full"} borderBottom={"1px solid"} borderColor={"grey.400"} px={[0, 4]} as="header">
      <Container maxW="xl" py={[0, 2]} px={[0, 4]}>
        <Flex flexDirection={["column", "column", "column", "row"]} alignItems="center" color="grey.800">
          {/* Logo */}
          <Link href="/" p={[4, 0]}>
            <Logo />
          </Link>
          <Box mt={["2w", "2w", "0"]} marginLeft="5w" textAlign={["center", "center", "initial"]} flexGrow={1}>
            <Heading as="h6" variant="h1" fontSize="gamma">
              Le {PRODUCT_NAME}{" "}
              <Tag backgroundColor="bluefrance" color="white" position="absolute" ml={4} mt={-2}>
                BETA
              </Tag>
            </Heading>
            <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
              Mettre à disposition des différents acteurs les données clés de l&apos;apprentissage en temps réel
            </Text>
          </Box>

          <Flex
            maxWidth="380px"
            h="42px"
            overflow="hidden"
            justifyItems="center"
            alignItems="center"
            mb={["3w", "3w", "0", "0"]}
          >
            {/* {espaceContextisLoading && <Skeleton height="30px" w="200px" startColor="grey.300" endColor="galt" />} */}
            {!espaceContextisLoading && <UserMenu />}
          </Flex>
        </Flex>
      </Container>
    </Container>
  );
};

export default Header;
