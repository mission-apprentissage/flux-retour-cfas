import React, { useState } from "react";
import { useRouter } from "next/router";
import { Box, Container, Flex, Skeleton, Text } from "@chakra-ui/react";
import useAuth from "../../../hooks/useAuth";
import { MenuFill, Close, Settings4Fill, UserFill, ParentGroupIcon } from "../../../theme/components/icons";
import Link from "../../Links/Link";
import { useEspace } from "../../../hooks/useEspace";
import { hasContextAccessTo, hasPageAccessTo } from "../../../common/utils/rolesUtils";
import { useOrganisme } from "../../../hooks/useOrganisme";

const NavItem = ({ children, to = "/", colorActive = "bluefrance", isActive = false, ...rest }) => {
  const router = useRouter();
  const isActiveInternal = isActive || router.pathname === to || router.asPath === to;

  return (
    <Link
      p={4}
      href={to}
      color={isActiveInternal ? colorActive : "grey.800"}
      _hover={{ textDecoration: "none", color: "grey.800", bg: "grey.200" }}
      borderBottom="3px solid"
      borderColor={isActiveInternal ? colorActive : "transparent"}
      bg={"transparent"}
      {...rest}
    >
      <Text display="block">{children}</Text>
    </Link>
  );
};

const NavContainer = ({ isOpen, children }) => {
  return (
    <Box
      display={{ base: isOpen ? "block" : "none", md: "block" }}
      flexBasis={{ base: "100%", md: "auto" }}
      w="full"
      px={1}
    >
      <Flex
        align="center"
        justify={["center", "space-between", "flex-end", "flex-start"]}
        direction={["column", "row", "row", "row"]}
        pb={[8, 0]}
        textStyle="sm"
      >
        {children}
      </Flex>
    </Box>
  );
};

const NavBarPublic = ({ isOpen }) => {
  return (
    <NavContainer isOpen={isOpen}>
      <NavItem to="/">Accueil</NavItem>
      <NavItem to="/explorer-les-indicateurs">Indicateurs en temps réel</NavItem>
      <NavItem to="/comprendre-les-donnees">Comprendre les données</NavItem>
      <NavItem to="/organisme-formation">Organisme de formation</NavItem>
    </NavContainer>
  );
};

const NavBarUser = ({ isOpen, mesOrganismesActive = false }) => {
  let [auth] = useAuth();
  let {
    navigation: { user: userNavigation },
    myOrganisme,
    isMonOrganismePages,
    isEffectifsPage,
    isTeleversementPage,
  } = useEspace();

  return (
    <NavContainer isOpen={isOpen}>
      <Box p={4} bg={"transparent"}>
        <UserFill mt="-0.3rem" boxSize={4} />
      </Box>
      <NavItem to={userNavigation.landingEspace.path}>{userNavigation.landingEspace.navTitle}</NavItem>

      {userNavigation.mesOrganismes && hasPageAccessTo(auth, "page/mes-organismes") && (
        <NavItem to={userNavigation.mesOrganismes.path} isActive={mesOrganismesActive}>
          {userNavigation.mesOrganismes.navTitle}
        </NavItem>
      )}

      {hasContextAccessTo(myOrganisme, "organisme/page_effectifs") && userNavigation.effectifs && (
        <NavItem
          to={userNavigation.effectifs.path}
          isActive={isMonOrganismePages && (isEffectifsPage || isTeleversementPage)}
        >
          {userNavigation.effectifs.navTitle}
        </NavItem>
      )}
      {hasContextAccessTo(myOrganisme, "organisme/page_sifa2") && userNavigation.sifa2 && (
        <NavItem to={userNavigation.sifa2.path}>{userNavigation.sifa2.navTitle}</NavItem>
      )}

      {hasContextAccessTo(myOrganisme, "organisme/page_parametres") && userNavigation.parametres && (
        <>
          <Box flexGrow={1} />
          <NavItem to={userNavigation.parametres.path}>
            <Settings4Fill boxSize={4} mr={2} color="bluefrance" /> {userNavigation.parametres.navTitle}
          </NavItem>
        </>
      )}
    </NavContainer>
  );
};

const NavBarOrganisme = ({ isOpen }) => {
  let {
    navigation: { organisme: organismeNavigation },
    isOrganismePages,
    isEffectifsPage,
    isTeleversementPage,
  } = useEspace();

  const { isloaded, organisme } = useOrganisme();

  if (!isloaded && !organisme) {
    return <Skeleton />;
  }

  return (
    <NavContainer isOpen={isOpen}>
      <Box p={4} bg={"transparent"}>
        <ParentGroupIcon mt="-0.3rem" boxSize={4} color="dsfr_lightprimary.bluefrance_850" />
      </Box>
      {hasContextAccessTo(organisme, "organisme/tableau_de_bord") && (
        <NavItem to={organismeNavigation.landingEspace.path} colorActive="dsfr_lightprimary.bluefrance_850">
          {organismeNavigation.landingEspace.navTitle}
        </NavItem>
      )}
      {hasContextAccessTo(organisme, "organisme/page_effectifs") && (
        <NavItem
          to={organismeNavigation.effectifs.path}
          colorActive="dsfr_lightprimary.bluefrance_850"
          isActive={isOrganismePages && (isEffectifsPage || isTeleversementPage)}
        >
          {organismeNavigation.effectifs.navTitle}
        </NavItem>
      )}
      {hasContextAccessTo(organisme, "organisme/page_sifa2") && (
        <NavItem to={organismeNavigation.sifa2.path} colorActive="dsfr_lightprimary.bluefrance_850">
          {organismeNavigation.sifa2.navTitle}
        </NavItem>
      )}
      {hasContextAccessTo(organisme, "organisme/page_parametres") && (
        <>
          <Box flexGrow={1} />
          <NavItem to={organismeNavigation.parametres.path} colorActive="dsfr_lightprimary.bluefrance_850">
            <Settings4Fill boxSize={4} mr={2} color="dsfr_lightprimary.bluefrance_850" />
            {organismeNavigation.parametres.navTitle}
          </NavItem>
        </>
      )}
    </NavContainer>
  );
};

const NavigationMenu = ({ espaceContextisLoading, ...props }) => {
  let [auth] = useAuth();
  const router = useRouter();

  let { isOrganismePages } = useEspace();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  const isMonEspacePage = router.pathname.includes("/mon-espace/") && auth?.sub !== "anonymous";
  const isMesOrganismes = router.pathname.includes("/mon-espace/mes-organismes") && auth?.sub !== "anonymous";

  function NavToggle({ toggle, isOpen }) {
    return (
      <Box display={{ base: "block", md: "none" }} onClick={toggle} py={4}>
        {isOpen ? <Close boxSize={8} /> : <MenuFill boxSize={8} />}
      </Box>
    );
  }

  return (
    <Box w="full" {...props} boxShadow="md">
      <Box borderBottom={"1px solid"} borderColor={"grey.400"}>
        <Container maxW="xl">
          <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" {...props}>
            <NavToggle toggle={toggle} isOpen={isOpen} />
            {!isMonEspacePage && !isOrganismePages && !espaceContextisLoading && <NavBarPublic isOpen={isOpen} />}
            {(isMonEspacePage || isOrganismePages) && !espaceContextisLoading && (
              <NavBarUser isOpen={isOpen} mesOrganismesActive={isMesOrganismes || isOrganismePages} />
            )}
          </Flex>
        </Container>
      </Box>
      {isOrganismePages && !espaceContextisLoading && (
        <Container maxW="xl" mt={1}>
          <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" {...props}>
            <NavBarOrganisme isOpen={isOpen} />
          </Flex>
        </Container>
      )}
    </Box>
  );
};

export default NavigationMenu;
