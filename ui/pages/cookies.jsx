import { Box, Container, Heading } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "../common/SSR/getAuthServerSideProps";
import { Page } from "../components";
import { Breadcrumb } from "../components/Breadcrumb/Breadcrumb";
import Cookies from "../components/legal/Cookies";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const CookiePage = () => {
  const title = "Gestion des Cookies";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box width="100%" paddingTop={[4, 8]} px={[1, 1, 6, 8]}>
        <Container maxWidth="xl">
          <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
          <Heading textStyle="h2" color="grey.800" marginTop={5}>
            {title}
          </Heading>
          <Cookies />
        </Container>
      </Box>
    </Page>
  );
};

export default CookiePage;
