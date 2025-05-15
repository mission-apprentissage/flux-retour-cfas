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
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";

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

enum MENU_ENTRIES {
  INFOS = "INFOS",
  ROLES = "ROLES",
  TRANSMISSIONS = "TRANSMISSIONS",
  ADMIN = "ADMIN",
  ALL_TRANSMISSIONS = "ALL_TRANSMISSIONS",
  USERS = "USERS",
  SEARCH_ORGANISME = "SEARCH_ORGANISME",
  FUSION_ORGANISMES = "FUSION_ORGANISMES",
  MAINTENANCE = "MAINTENANCE",
  IMPOSTURES = "IMPOSTURES",
}
const UserMenu = () => {
  const { auth, organisationType } = useAuth();

  const logout = async () => {
    await _post("/api/v1/auth/logout");
    window.location.href = "/";
  };

  const hasRight = (entry) => {
    switch (entry) {
      case MENU_ENTRIES.ROLES:
        return organisationType !== "MISSION_LOCALE";
      case MENU_ENTRIES.TRANSMISSIONS:
        return organisationType === "ORGANISME_FORMATION";
      case MENU_ENTRIES.ADMIN:
        return organisationType === "ADMINISTRATEUR";
      default:
        false;
    }
  };

  return (
    <>
      {!auth && (
        <HStack>
          <Link href="/auth/inscription" plausibleGoal="clic_homepage_inscription_header" variant="pill" px={3} py={1}>
            <Text lineHeight={6}>
              <AccountUnfill boxSize={5} mr={2} />
              S&apos;inscrire
            </Text>
          </Link>
          <Link href="/auth/connexion" plausibleGoal="clic_homepage_connexion_header" variant="pill" px={3} py={1}>
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
                    Mon compte
                  </Text>
                </Box>
              </Flex>
            </MenuButton>
            <MenuList>
              <MenuItem href="/mon-compte" icon={<Settings4Fill boxSize={4} color={"bluefrance"} />}>
                Informations
              </MenuItem>
              {hasRight(MENU_ENTRIES.ROLES) && (
                <MenuItem href="/organisation/membres" icon={<Parametre boxSize={4} />}>
                  Rôles et habilitations
                </MenuItem>
              )}
              {hasRight(MENU_ENTRIES.TRANSMISSIONS) && (
                <MenuItem href="/transmissions" icon={<Parametre boxSize={4} />}>
                  Transmissions
                </MenuItem>
              )}
              {hasRight(MENU_ENTRIES.ADMIN) && (
                <MenuGroup title="Administration">
                  <MenuItem href="/admin/transmissions" icon={<Parametre boxSize={4} />}>
                    Toutes les transmissions
                  </MenuItem>
                  <MenuItem href="/admin/users" icon={<Parametre boxSize={4} />}>
                    Gestion des utilisateurs
                  </MenuItem>
                  <MenuItem href="/admin/reseaux" icon={<Parametre boxSize={4} />}>
                    Gestion des réseaux
                  </MenuItem>
                  <MenuItem href="/admin/organismes/recherche" icon={<Parametre boxSize={4} />}>
                    Recherche organisme
                  </MenuItem>
                  <MenuItem href="/admin/fusion-organismes" icon={<Parametre boxSize={4} />}>
                    Fusion d&apos;organismes
                  </MenuItem>
                  <MenuItem href="/admin/organismes/gestion" icon={<Parametre boxSize={4} />}>
                    Gestion des organismes
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
  const router = useRouter();

  const handleImpersonationExit = async () => {
    await _delete("/api/v1/admin/impersonate");

    const pathsWithOrganismeId = [
      "/",
      "/indicateurs",
      "/effectifs",
      "/enquete-sifa",
      "/transmissions",
      new RegExp("^/organismes.*"),
      new RegExp("^/transmissions/\\d{4}-\\d{2}-\\d{2}$"),
    ];

    const shouldRedirectWithOrganismeId = pathsWithOrganismeId.some((path) =>
      typeof path === "string" ? router.asPath === path : path.test(router.asPath)
    );

    const redirectPath =
      shouldRedirectWithOrganismeId &&
      auth?.organisation?.type === "ORGANISME_FORMATION" &&
      auth.organisation.organisme_id
        ? `/organismes/${auth.organisation.organisme_id}${router.asPath}`
        : router.asPath;

    window.location.href = redirectPath;
  };

  return (
    <Container maxW={"full"} borderBottom={"1px solid"} borderColor={"grey.400"} px={[0, 4]} as="header">
      <Container maxW="xl" py={[0, 3]} px={[0, 6]}>
        <Flex flexDirection={["column", "column", "column", "row"]} alignItems="center" color="grey.800">
          <Link href="/" p={[4, 0]}>
            <Image src="/images/marianne.svg" alt="Logo République française" userSelect="none" />
          </Link>
          <Box mt={["2w", "2w", "0"]} marginLeft="4w" textAlign={["center", "center", "initial"]} flexGrow={1}>
            <Heading as="h6" variant="h1" fontSize="gamma">
              {PRODUCT_NAME_TITLE}{" "}
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
              onClick={handleImpersonationExit}
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
