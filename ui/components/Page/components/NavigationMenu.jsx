import React, { useState } from "react";
import { useRouter } from "next/router";
import { Box, Container, Flex, Text } from "@chakra-ui/react";
import useAuth from "../../../hooks/useAuth";
import { MenuFill, Close, Settings4Fill, ArrowDropRightLine } from "../../../theme/components/icons";
import Link from "../../Links/Link";

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
      {...rest}
    >
      <Text display="block">{children}</Text>
    </Link>
  );
};

const NavLinks = ({ isOpen }) => {
  let [auth] = useAuth();
  const router = useRouter();
  const myWks = router.pathname.includes("/mon-espace") && auth?.sub !== "anonymous";

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
        {!myWks && (
          <>
            <NavItem to="/">Accueil</NavItem>
            <NavItem to="/explorer-les-indicateurs">Indicateurs en temps réel</NavItem>
            <NavItem to="/comprendre-les-donnees">Comprendre les données</NavItem>
            <NavItem to="/organisme-formation">Organisme de formation</NavItem>
          </>
        )}
        {myWks && (
          <>
            <Box p={4} bg={"transparent"}>
              {/* Aden formation Caen */}
              Mon organisme
              <ArrowDropRightLine boxSize={3} />
            </Box>
            <NavItem to="/mon-espace/mon-organisme">Informations</NavItem>

            <NavItem to="/mon-organisme/effectifs">Effectifs</NavItem>
            <NavItem to="/mon-organisme/enquete-SIFA2">Enquête SIFA2</NavItem>
            <Box flexGrow={1} />
            <NavItem to="/mon-organisme/parametres">
              <Settings4Fill boxSize={4} mr={2} /> Paramètres
            </NavItem>
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
