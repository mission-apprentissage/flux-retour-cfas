import { Box, Container, Link } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";
import { CRISP_FAQ } from "shared";

import { Interrogation } from "@/theme/components/icons";

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
      <Box minH={"40vh"} flexGrow="1" pb={20}>
        {children}
      </Box>
      <Link
        isExternal
        href={CRISP_FAQ}
        position="fixed"
        width="60px"
        height="60px"
        bottom="40px"
        right="40px"
        bg="bluefrance"
        borderRadius="200px"
        aria-label="Accéder à la FAQ"
      >
        <Interrogation color="white" pr="0.1em" pb="0.2em" />
      </Link>
      <Footer />
    </Container>
  );
}

export default SimplePage;
