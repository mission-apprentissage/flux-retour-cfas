import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";
import ContactSection from "../ContactSection/ContactSection";
import Section from "../Section/Section";
import { useEspace } from "../../hooks/useEspace";

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
      <ContactSection />
      <Footer />
    </Container>
  );
}
