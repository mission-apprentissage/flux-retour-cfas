import { Flex, Link, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { ReactNode } from "react";

const OrganismeFormationPagesMenu = (props) => {
  return (
    <NavBarContainer {...props}>
      <NavLinks />
    </NavBarContainer>
  );
};

const NavItem = ({ children, to = "/", ...rest }: { children: ReactNode; to: string }) => {
  const router = useRouter();
  const isActive = router.pathname === to;

  return (
    <Link
      p={4}
      href={to}
      color={isActive ? "bluefrance" : "grey.800"}
      _hover={{ textDecoration: "none", color: "grey.800", bg: "grey.200" }}
      borderLeft="2px solid"
      borderColor={isActive ? "bluefrance" : "transparent"}
      bg={"transparent"}
    >
      <Text display="block" {...rest}>
        {children}
      </Text>
    </Link>
  );
};

const NavLinks = () => {
  return (
    <Flex flexDirection="column">
      <NavItem to="/organisme-formation/transmettre">Comment transmettre les données de votre organisme ?</NavItem>
      <br />
      <NavItem to="/organisme-formation/consulter">
        Comment consulter et vérifier les données que vous transmettez ?
      </NavItem>
      <br />
      <NavItem to="/questions-reponses">Une question ? Besoin d’aide ? Consulter la page d’aide</NavItem>
    </Flex>
  );
};

const NavBarContainer = ({ children }: { children: ReactNode }) => {
  return (
    <Flex as="nav" flexWrap="wrap">
      {children}
    </Flex>
  );
};

export default OrganismeFormationPagesMenu;
