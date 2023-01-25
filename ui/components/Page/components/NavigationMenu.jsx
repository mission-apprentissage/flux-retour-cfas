import React, { useState } from "react";
import { useRouter } from "next/router";
import { Box, Container, Flex, Skeleton, Text, Tooltip } from "@chakra-ui/react";

import useAuth from "../../../hooks/useAuth";
import { MenuFill, Close, Settings4Fill, ParentGroupIcon } from "../../../theme/components/icons";
import Link from "../../Links/Link";
import { useEspace } from "../../../hooks/useEspace";
import { hasContextAccessTo, hasPageAccessTo } from "../../../common/utils/rolesUtils";
import { useOrganisme } from "../../../hooks/useOrganisme";

const NavItem = ({
  children,
  to = "/",
  colorActive = "bluefrance",
  isActive = false,
  isDisabled = false,
  disabledReason = "",
  colorDisabled = "dgalt",
  ...rest
}) => {
  const router = useRouter();
  const isActiveInternal = isActive || router.pathname === to || router.asPath === to;

  const hasState = isActiveInternal || isDisabled;
  const colorCurrentState = isActiveInternal ? colorActive : isDisabled ? colorDisabled : "";

  const Component = isDisabled ? Box : Link;
  const TextComponent = isDisabled && disabledReason ? Tooltip : Text;

  return (
    <Component
      p={4}
      href={to}
      color={hasState ? colorCurrentState : "grey.800"}
      borderBottom="3px solid"
      borderColor={isActiveInternal ? colorCurrentState : "transparent"}
      bg={"transparent"}
      {...{
        ...(isDisabled
          ? { cursor: "not-allowed" }
          : { _hover: { textDecoration: "none", color: "grey.800", bg: "grey.200" } }),
      }}
      {...rest}
    >
      <TextComponent
        display="block"
        {...(isDisabled && disabledReason
          ? {
              label: disabledReason,
              "aria-label": disabledReason,
            }
          : {})}
      >
        <>{children}</>
      </TextComponent>
    </Component>
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
      {hasContextAccessTo(myOrganisme, "organisme/page_sifa") && userNavigation.sifa2 && (
        <NavItem
          to={userNavigation.sifa2.path}
          isDisabled={!myOrganisme.first_transmission_date}
          disabledReason={
            !myOrganisme.first_transmission_date ? "Désactivé car votre organisme n'a encore rien transmis" : ""
          }
        >
          {userNavigation.sifa2.navTitle}
        </NavItem>
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
      {hasContextAccessTo(organisme, "organisme/page_sifa") && (
        <NavItem
          to={organismeNavigation.sifa2.path}
          colorActive="dsfr_lightprimary.bluefrance_850"
          isDisabled={!organisme.first_transmission_date}
          disabledReason={
            !organisme.first_transmission_date ? "Désactivé car cet organisme n'a encore rien transmis" : ""
          }
        >
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
