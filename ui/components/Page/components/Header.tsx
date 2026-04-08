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
import { CRISP_FAQ } from "shared";

import { PRODUCT_NAME_TITLE } from "@/common/constants/product";
import { _delete, _post } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";
import { getAccountLabel } from "@/common/utils/accountUtils";
import { isCfaWithMlBeta as checkCfaWithMlBeta } from "@/common/utils/cfaUtils";
import Link from "@/components/Links/Link";
import MenuItem from "@/components/Links/MenuItem";
import useAuth from "@/hooks/useAuth";
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

  const isCfaWithMlBeta = checkCfaWithMlBeta(auth?.organisation);

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

  const buttonLabel = (() => {
    if (isCfaWithMlBeta && auth?.prenom && auth?.nom) {
      return `${auth.prenom.charAt(0).toUpperCase()}${auth.prenom.slice(1)} ${auth.nom.charAt(0).toUpperCase()}.`;
    }
    return getAccountLabel(auth as AuthContext);
  })();

  const cfaName = isCfaWithMlBeta ? auth?.organisation_nom : null;

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
              <Flex maxWidth="280px" alignItems="center">
                <i
                  className="ri-account-circle-fill"
                  style={{ fontSize: "1.125rem", color: "#000091", flexShrink: 0 }}
                />
                <Box display={["none", "block"]} ml={2} textAlign="left">
                  <Text
                    color="bluefrance"
                    textStyle="sm"
                    fontWeight={isCfaWithMlBeta ? "700" : undefined}
                    textOverflow="ellipsis"
                    maxWidth="240px"
                    overflow="hidden"
                  >
                    {buttonLabel}
                  </Text>
                  {cfaName && (
                    <Text color="bluefrance" fontSize="0.75rem" fontWeight="400" lineHeight="1.2">
                      {cfaName}
                    </Text>
                  )}
                </Box>
              </Flex>
            </MenuButton>
            <MenuList color="#000091">
              <MenuItem
                href="/mon-compte"
                icon={<i className="ri-account-circle-fill" style={{ fontSize: "0.875rem" }} />}
              >
                Mon compte
              </MenuItem>
              {hasRight(MENU_ENTRIES.ROLES) && (
                <MenuItem
                  href="/organisation/membres"
                  icon={<i className="ri-team-fill" style={{ fontSize: "0.875rem" }} />}
                >
                  Rôles et habilitations
                </MenuItem>
              )}
              {hasRight(MENU_ENTRIES.TRANSMISSIONS) && (
                <MenuItem
                  href="/transmissions"
                  icon={<i className="ri-send-plane-fill" style={{ fontSize: "0.875rem" }} />}
                >
                  Transmissions
                </MenuItem>
              )}
              {isCfaWithMlBeta && (
                <>
                  <MenuItem
                    href="/cfa/parametres"
                    icon={<i className="ri-settings-5-fill" style={{ fontSize: "0.875rem" }} />}
                  >
                    Paramètres de connexion ERP
                  </MenuItem>
                  <MenuGroup title="Aide et ressources">
                    <MenuItem
                      href={CRISP_FAQ}
                      icon={<i className="ri-question-fill" style={{ fontSize: "0.875rem" }} />}
                    >
                      Centre d&apos;aide
                    </MenuItem>
                    <MenuItem
                      href="/glossaire"
                      icon={<i className="ri-book-2-fill" style={{ fontSize: "0.875rem" }} />}
                    >
                      Glossaire
                    </MenuItem>
                    <MenuItem
                      href="/referencement-organisme"
                      icon={<i className="ri-building-fill" style={{ fontSize: "0.875rem" }} />}
                    >
                      Référencement organisme
                    </MenuItem>
                  </MenuGroup>
                </>
              )}
              {hasRight(MENU_ENTRIES.ADMIN) && (
                <MenuGroup title="Administration">
                  <MenuItem href="/admin/transmissions" icon={<Parametre boxSize={3} color="#000091" />}>
                    Toutes les transmissions
                  </MenuItem>
                  <MenuItem href="/admin/users" icon={<Parametre boxSize={3} color="#000091" />}>
                    Gestion des utilisateurs
                  </MenuItem>
                  <MenuItem href="/admin/reseaux" icon={<Parametre boxSize={3} color="#000091" />}>
                    Gestion des réseaux
                  </MenuItem>
                  <MenuItem href="/admin/organismes/recherche" icon={<Parametre boxSize={3} color="#000091" />}>
                    Recherche organisme
                  </MenuItem>
                  <MenuItem href="/admin/fusion-organismes" icon={<Parametre boxSize={3} color="#000091" />}>
                    Fusion d&apos;organismes
                  </MenuItem>
                  <MenuItem href="/admin/organismes/gestion" icon={<Parametre boxSize={3} color="#000091" />}>
                    Gestion des organismes
                  </MenuItem>
                  <MenuItem href="/admin/maintenance" icon={<Parametre boxSize={3} color="#000091" />}>
                    Message de maintenance
                  </MenuItem>
                  <MenuItem href="/admin/impostures" icon={<SpyLineIcon boxSize={3} color="#000091" />}>
                    Impostures
                  </MenuItem>
                </MenuGroup>
              )}
              <MenuDivider />
              <ChakraMenuItem onClick={logout} color="var(--text-default-error)">
                <i
                  className="ri-logout-box-r-fill"
                  style={{ fontSize: "0.875rem", color: "var(--text-default-error)", marginRight: "0.5rem" }}
                />
                Déconnexion
              </ChakraMenuItem>
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
