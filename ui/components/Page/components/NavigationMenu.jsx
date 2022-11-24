import React, { useState } from "react";
import { useRouter } from "next/router";
import { Box, Container, Flex, Text } from "@chakra-ui/react";
import useAuth from "../../../hooks/useAuth";
import { MenuFill, Close, Settings4Fill, UserFill, ParentGroupIcon } from "../../../theme/components/icons";
import Link from "../../Links/Link";

const NavItem = ({ children, to = "/", colorActive = "bluefrance", isActive = false, ...rest }) => {
  const router = useRouter();
  const isActiveInternal = isActive || router.pathname === to;

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

const NavBarPublic = ({ isOpen }) => {
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
        <NavItem to="/">Accueil</NavItem>
        <NavItem to="/explorer-les-indicateurs">Indicateurs en temps réel</NavItem>
        <NavItem to="/comprendre-les-donnees">Comprendre les données</NavItem>
        <NavItem to="/organisme-formation">Organisme de formation</NavItem>
      </Flex>
    </Box>
  );
};

const NavBarUser = ({ isOpen, mesOrganismesActive = false }) => {
  const myOwn = {
    landingOrganisme: {
      name: "Mon tableau de bord",
      path: "/mon-espace/mon-organisme",
    },
    effectifs: {
      name: "Mes effectifs",
      path: "/mon-espace/mon-organisme/effectifs",
    },
    sifa2: {
      name: "Mon enquête SIFA2",
      path: "/mon-espace/mon-organisme/enquete-SIFA2",
    },
    parametres: {
      name: "Mes paramètres",
      path: "/mon-espace/mon-organisme/parametres",
    },
    mesOrganismes: {
      name: "Sur mon territoire",
      path: "/mon-espace/mes-organismes",
    },
  };

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
        <Box p={4} bg={"transparent"}>
          <UserFill mt="-0.3rem" boxSize={4} />
        </Box>
        <NavItem to={myOwn.landingOrganisme.path}>{myOwn.landingOrganisme.name}</NavItem>
        <NavItem to={myOwn.mesOrganismes.path} isActive={mesOrganismesActive}>
          {myOwn.mesOrganismes.name}
        </NavItem>
        <NavItem to={myOwn.effectifs.path}>{myOwn.effectifs.name}</NavItem>
        <NavItem to={myOwn.sifa2.path}>{myOwn.sifa2.name}</NavItem>

        <Box flexGrow={1} />
        <NavItem to={myOwn.parametres.path}>
          <Settings4Fill boxSize={4} mr={2} color="bluefrance" /> {myOwn.parametres.name}
        </NavItem>
      </Flex>
    </Box>
  );
};

const NavBarOrganisme = ({ isOpen }) => {
  const organisme = {
    landingOrganisme: {
      name: "Son tableau de bord",
      path: "/espace/organisme/453533583585",
    },
    effectifs: {
      name: "Ses effectifs",
      path: "/espace/organisme/453533583585/effectifs",
    },
    sifa2: {
      name: "Son enquête SIFA2",
      path: "/espace/organisme/453533583585/enquete-SIFA2",
    },
    parametres: {
      name: "Ses paramètres",
      path: "/espace/organisme/453533583585/parametres",
    },
  };

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
        <>
          <Box p={4} bg={"transparent"}>
            <ParentGroupIcon mt="-0.3rem" boxSize={4} color="dsfr_lightprimary.bluefrance_850" />
          </Box>
          <NavItem to={organisme.landingOrganisme.path} colorActive="dsfr_lightprimary.bluefrance_850">
            {organisme.landingOrganisme.name}
          </NavItem>
          <NavItem to={organisme.effectifs.path} colorActive="dsfr_lightprimary.bluefrance_850">
            {organisme.effectifs.name}
          </NavItem>
          <NavItem to={organisme.sifa2.path} colorActive="dsfr_lightprimary.bluefrance_850">
            {organisme.sifa2.name}
          </NavItem>

          <Box flexGrow={1} />
          <NavItem to={organisme.parametres.path} colorActive="dsfr_lightprimary.bluefrance_850">
            <Settings4Fill boxSize={4} mr={2} color="dsfr_lightprimary.bluefrance_850" /> {organisme.parametres.name}
          </NavItem>
        </>
      </Flex>
    </Box>
  );
};

const NavigationMenu = ({ ...props }) => {
  let [auth] = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const isWorkspacePage = router.pathname.includes("/mon-espace/") && auth?.sub !== "anonymous";
  const isMesOrganismes = router.pathname.includes("/mon-espace/mes-organismes") && auth?.sub !== "anonymous";
  const isAOrganismePage = router.pathname.includes("/espace/") && auth?.sub !== "anonymous";

  function NavToggle({ toggle, isOpen }) {
    return (
      <Box display={{ base: "block", md: "none" }} onClick={toggle} py={4}>
        {isOpen ? <Close boxSize={8} /> : <MenuFill boxSize={8} />}
      </Box>
    );
  }

  return (
    <Box w="full" {...props} boxShadow="md">
      <Box borderBottom={"3px solid"} borderColor={"grey.400"}>
        <Container maxW="xl">
          <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" {...props}>
            <NavToggle toggle={toggle} isOpen={isOpen} />
            {!isWorkspacePage && !isAOrganismePage && <NavBarPublic isOpen={isOpen} />}
            {(isWorkspacePage || isAOrganismePage) && (
              <NavBarUser isOpen={isOpen} mesOrganismesActive={isMesOrganismes || isAOrganismePage} />
            )}
          </Flex>
        </Container>
      </Box>
      {isAOrganismePage && (
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
