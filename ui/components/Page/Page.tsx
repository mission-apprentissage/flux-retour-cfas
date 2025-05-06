import { Box, Container, ContainerProps } from "@chakra-ui/react";
import React from "react";
import { CRISP_FAQ } from "shared";

import Link from "@/components/Links/Link";
import Section from "@/components/Section/Section";
import { Interrogation } from "@/theme/components/icons";

import Footer from "./components/Footer";
import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";

type PageProps = {
  children: React.ReactNode;
  childrenContainer?: React.ComponentType | string;
} & ContainerProps;

function Page({ children, childrenContainer, ...rest }: PageProps) {
  const ChildrenContainer = childrenContainer || Section;

  return (
    <Container maxW="full" minH="100vh" display="flex" flexDirection="column" p={0} {...rest}>
      <Header />
      <NavigationMenu />
      <Box minH="40vh" flexGrow="1" pb={8}>
        <ChildrenContainer>{children}</ChildrenContainer>
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

export default Page;
