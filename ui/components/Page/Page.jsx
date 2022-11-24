import React from "react";
import { Box, Center, Container, Spinner } from "@chakra-ui/react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";
import ContactSection from "../ContactSection/ContactSection";
import Section from "../Section/Section";
import { useEspace } from "../../hooks/useEspace";

export function Page({ children, ...rest }) {
  let { isloaded, isMonOrganismePages, isOrganismePages } = useEspace();

  if (!isloaded && (isMonOrganismePages || isOrganismePages)) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Container maxW="full" minH="100vh" d="flex" flexDirection="column" p={0} {...rest}>
      <Header />
      <NavigationMenu />
      <Box minH={"47vh"} flexGrow="1">
        <Section>{children}</Section>
      </Box>
      <ContactSection />
      <Footer />
    </Container>
  );
}
