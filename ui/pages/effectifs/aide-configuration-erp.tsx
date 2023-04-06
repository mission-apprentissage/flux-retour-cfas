import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import ConfigurationAPI from "@/modules/mon-espace/effectifs/ConfigurationAPI";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageAideConfigurationErp = () => {
  const title = "Configuration ERP";
  // apparemment pas besoin de l'organisme ici
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <ConfigurationAPI />
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageAideConfigurationErp);
