import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import EffectifsPage from "@/modules/mon-espace/effectifs/EffectifsPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeMonOrganisme = () => {
  const title = "Mes effectifs";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Box mt={4}>
            <EffectifsPage isMine={true} />
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageEffectifsDeMonOrganisme);
