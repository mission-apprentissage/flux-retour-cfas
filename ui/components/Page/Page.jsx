import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";
import ContactSection from "../ContactSection/ContactSection";
import Section from "../Section/Section";

export function Page({ children, ...rest }) {
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
