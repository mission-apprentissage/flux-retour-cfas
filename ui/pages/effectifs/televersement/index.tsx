import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import TeleversementsLanding from "@/modules/mon-espace/effectifs/TeleversementsLanding";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageImportEffectifsDeMonOrganisme = () => {
  const router = useRouter();
  return (
    <Page>
      <Head>
        <title>Mes effectifs - Import</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl">
          <TeleversementsLanding importUrl={`${router.asPath}/fichier`} />
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageImportEffectifsDeMonOrganisme);
