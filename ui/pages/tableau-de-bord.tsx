import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import Header from "@/components/Page/components/Header";
import NavigationMenu from "@/components/Page/components/NavigationMenu";
import NewDashboardTransverse from "@/modules/dashboard/NewDashboardTransverse";

function DashboardPage() {
  return (
    <Container maxW="full" minH="100vh" display="flex" flexDirection="column" p={0}>
      <Header />
      <NavigationMenu />
      <Box minH={"40vh"} flexGrow="1" pb={8}>
        <Head>
          <title>Mon tableau de bord</title>
        </Head>
        <NewDashboardTransverse />
      </Box>
    </Container>
  );
}

export default DashboardPage;
