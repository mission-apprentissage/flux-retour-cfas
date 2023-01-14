import React from "react";
import { Box, Container, Link } from "@chakra-ui/react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";
import ContactSection from "../ContactSection/ContactSection";
import Section from "../Section/Section";
import { useEspace } from "../../hooks/useEspace";
import { Interrogation } from "../../theme/components/icons";
import NavLink from "next/link";

export function Page({ children, ...rest }) {
  let { isloaded, isReloaded, isMonOrganismePages, isOrganismePages, isMesOrganismesPages } = useEspace();

  const espaceContextisLoading =
    (!isloaded || !isReloaded) && (isMonOrganismePages || isOrganismePages || isMesOrganismesPages);

  return (
    <Container maxW="full" minH="100vh" d="flex" flexDirection="column" p={0} {...rest}>
      <Header espaceContextisLoading={espaceContextisLoading} />
      <NavigationMenu espaceContextisLoading={espaceContextisLoading} />
      <Box minH={"40vh"} flexGrow="1">
        <Section>{!espaceContextisLoading && children}</Section>
      </Box>
      <Link
        as={NavLink}
        _target="blank"
        href="https://www.notion.so/mission-apprentissage/Documentation-dbb1eddc954441eaa0ba7f5c6404bdc0"
        position="fixed"
        width="60px"
        height="60px"
        bottom="40px"
        right="40px"
      >
        <Interrogation />
      </Link>
      <ContactSection />
      <Footer />
    </Container>
  );
}
