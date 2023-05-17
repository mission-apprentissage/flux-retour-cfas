import { Box, Flex } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import ConfigurationERP from "@/modules/mon-compte/ConfigurationERP";
import NavigationCompte from "@/modules/mon-compte/NavigationCompte";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ConfigurationErpPage = () => {
  return (
    <Page>
      <Head>
        <title>Paramétrage  ERP</title>
      </Head>
      <Flex>
        <NavigationCompte />
        <Box w="100%" pt={[4, 8]} mb={5}>
          <ConfigurationERP />
        </Box>
      </Flex>
    </Page>
  );
};

export default withAuth(ConfigurationErpPage);
