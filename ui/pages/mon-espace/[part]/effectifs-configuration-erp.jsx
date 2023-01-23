import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import { Breadcrumb } from "../../../components/Breadcrumb/Breadcrumb";
import { Page } from "../../../components/Page/Page";
import withAuth from "../../../components/withAuth";
import { getAuthServerSideProps } from "../../../common/SSR/getAuthServerSideProps";
import { useEspace } from "../../../hooks/useEspace";
import ConfigurationAPI from "../../../modules/mon-espace/effectifs/ConfigurationAPI";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const MonEspace = () => {
  let { breadcrumb } = useEspace();
  return (
    <Page>
      <Head>
        <title>Mon espace</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={breadcrumb} />
          <Box mt={4}>
            <ConfigurationAPI />
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(MonEspace);
