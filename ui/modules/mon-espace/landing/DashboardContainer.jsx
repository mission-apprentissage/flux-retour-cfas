import React from "react";
import PropTypes from "prop-types";
import { Box, Breadcrumb, Container, Heading, Stack } from "@chakra-ui/react";
import withAuth from "@/components/withAuth";
import Page from "@/components/Page/Page";
import Head from "next/head";
import { PAGES } from "@/components/Breadcrumb/Breadcrumb";

const DashboardContainer = ({ children }) => {
  return (
    <Page>
      <Head>
        <title>Tableau de bord</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace()]} />

          <Stack spacing="2w">
            <Heading textStyle="h2" color="grey.800">
              Bienvenue sur votre tableau de bord
            </Heading>
          </Stack>

          {children}
        </Container>
      </Box>
    </Page>
  );
};

DashboardContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

export default withAuth(DashboardContainer);
