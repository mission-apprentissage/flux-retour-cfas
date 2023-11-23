import { Box, Container, Heading } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Accessibilite from "@/components/legal/Accessibilite";
import Page from "@/components/Page/Page";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const AccessibilitePage = () => {
  const title = "Déclaration d’accessibilité";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]}>
        <Container maxW="xl">
          <Heading textStyle="h2" color="grey.800" mt={5}>
            {title}
          </Heading>
          <Accessibilite />
        </Container>
      </Box>
    </Page>
  );
};

export default AccessibilitePage;
