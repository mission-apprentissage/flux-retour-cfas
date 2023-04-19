import React from "react";
import { Box, Container } from "@chakra-ui/react";

import Footer from "./components/Footer";
import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";
import Section from "../Section/Section";
import { Interrogation } from "../../theme/components/icons";
import Link from "../Links/Link";

function Page({ children, ...rest }) {
  return (
    <Container maxW="full" minH="100vh" display="flex" flexDirection="column" p={0} {...rest}>
      <Header />
      <NavigationMenu />
      <Box minH={"40vh"} flexGrow="1" pb={8}>
        <Section>{children}</Section>
      </Box>
      <Link
        isExternal
        href="https://www.notion.so/mission-apprentissage/Documentation-dbb1eddc954441eaa0ba7f5c6404bdc0"
        position="fixed"
        width="60px"
        height="60px"
        bottom="40px"
        right="40px"
        bg="bluefrance"
        borderRadius="200px"
      >
        <Interrogation color="white" pr="0.1em" pb="0.2em" />
      </Link>
      <Footer />
    </Container>
  );
}

export default Page;
