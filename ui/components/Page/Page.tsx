import { Box, Container, ContainerProps } from "@chakra-ui/react";
import React from "react";

import Section from "@/components/Section/Section";

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
      <Footer />
    </Container>
  );
}

export default Page;
