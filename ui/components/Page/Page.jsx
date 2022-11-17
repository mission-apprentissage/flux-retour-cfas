import { Box, Container } from "@chakra-ui/react";
import React from "react";

import ContactSection from "../ContactSection/ContactSection";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";

export function Page({ children, ...rest }) {
  return (
    <Container maxWidth="full" minHeight="100vh" display="flex" flexDirection="column" padding={0} {...rest}>
      <Header />
      <NavigationMenu />
      <Box minHeight={"60vh"} flexGrow="1">
        <Box width="100%" py={[4, 8]} px={[1, 1, 12, 24]}>
          <Container maxWidth="xl">{children}</Container>
        </Box>
      </Box>
      <ContactSection />
      <Footer />
    </Container>
  );
}
