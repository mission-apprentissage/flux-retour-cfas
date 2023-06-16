import {
  Box,
  Button,
  MenuItem as ChakraMenuItem,
  Container,
  Flex,
  HStack,
  Heading,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuList,
  Tag,
  Text,
} from "@chakra-ui/react";

import { PRODUCT_NAME_TITLE } from "@/common/constants/product";
import { _delete, _post } from "@/common/httpClient";
import Link from "@/components/Links/Link";
import MenuItem from "@/components/Links/MenuItem";
import useAuth from "@/hooks/useAuth";
import { Settings4Fill, UserFill } from "@/theme/components/icons";
import { AccountFill } from "@/theme/components/icons/AccountFill";
import { AccountUnfill } from "@/theme/components/icons/AccountUnfill";
import { ExitIcon } from "@/theme/components/icons/ExitIcon";
import { Parametre } from "@/theme/components/icons/Parametre";
import { SpyLineIcon } from "@/theme/components/icons/SpyLine";

const UserMenu = () => {
  const { auth, organisationType } = useAuth();

  const logout = async () => {
    await _post("/api/v1/auth/logout");
    window.location.href = "/";
  };

  // FIXME: corriger le chargement de l'auth
  return (
    <>
      {!auth && (
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
      {auth && (
        <Flex w="full">
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
              <MenuItem href="/organisation/membres" icon={<Parametre boxSize={4} />}>
                Rôles et habilitations
              </MenuItem>
              {organisationType === "ADMINISTRATEUR" && (
                <MenuGroup title="Administration">
                  <MenuItem href="/admin/users" icon={<Parametre boxSize={4} />}>
                    Gestion des utilisateurs
                  </MenuItem>
                  <MenuItem href="/admin/organismes" icon={<Parametre boxSize={4} />}>
                    Gestion des organismes
                  </MenuItem>
                  <MenuItem href="/admin/effectifs" icon={<Parametre boxSize={4} />}>
                    Gestion des effectifs
                  </MenuItem>
                  <MenuItem href="/admin/maintenance" icon={<Parametre boxSize={4} />}>
                    Message de maintenance
                  </MenuItem>
                  <MenuItem href="/admin/impostures" icon={<SpyLineIcon boxSize={4} />}>
                    Impostures
                  </MenuItem>
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

const Header = () => {
  const { auth } = useAuth();

  return (
    <Container maxW={"full"} borderBottom={"1px solid"} borderColor={"grey.400"} px={[0, 4]} as="header">
      <Container maxW="xl" py={[0, 2]} px={[0, 4]}>
        <Flex flexDirection={["column", "column", "column", "row"]} alignItems="center" color="grey.800">
          <Link href="/" p={[4, 0]}>
            <Image
              src="/images/marianne.svg#svgView(viewBox(12 0 152 78))"
              alt="Logo République française"
              userSelect="none"
            />
          </Link>
          <Box mt={["2w", "2w", "0"]} marginLeft="5w" textAlign={["center", "center", "initial"]} flexGrow={1}>
            <Heading as="h6" variant="h1" fontSize="gamma">
              {PRODUCT_NAME_TITLE}{" "}
              <Tag backgroundColor="#FEE7FC" color="#6E445A" fontWeight="bold" ml={1}>
                BETA
              </Tag>
            </Heading>
          </Box>

          {auth?.impersonating && (
            <Button
              leftIcon={<ExitIcon />}
              size="sm"
              colorScheme="red"
              px={4}
              mt={["2w", "2w", "2w", "0"]}
              mx={["0", "0", "2w", "2w"]}
              onClick={async () => {
                await _delete("/api/v1/admin/impersonate");
                location.href = "/";
              }}
            >
              Imposture en cours
            </Button>
          )}
          <Flex
            maxWidth="380px"
            h="42px"
            overflow="hidden"
            justifyItems="center"
            alignItems="center"
            mb={["3w", "3w", "0", "0"]}
          >
            <UserMenu />
          </Flex>
        </Flex>
      </Container>
    </Container>
  );
};

export default Header;
