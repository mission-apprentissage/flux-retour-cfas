import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import Footer from "./components/Footer";
import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";

/**
 * Conteneur de page sans padding pour le contenu.
 */
interface Props {
  title?: string;
  children: React.ReactNode;
}
function SimplePage({ title, children }: Props) {
  return (
    <Container maxW="full" minH="100vh" display="flex" flexDirection="column" p={0}>
      <Head>{title && <title>{title}</title>}</Head>
      <Header />
      <NavigationMenu />
      <Box minH={"40vh"} flexGrow="1" pb={8}>
        {children}
      </Box>
      <Footer />
    </Container>
  );
}

export default SimplePage;
