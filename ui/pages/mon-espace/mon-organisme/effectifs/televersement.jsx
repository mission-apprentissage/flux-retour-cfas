import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEspace } from "@/hooks/useEspace";
import Televersements from "@/modules/mon-espace/effectifs/Televersements";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageImportEffectifsDeMonOrganisme = () => {
  let { myOrganisme } = useEspace();

  const title = "Import";

  return (
    <Page>
      <Head>
        <title>Mes effectifs - {title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace(), PAGES.mesEffectifs(), { title }]} />
          <Box mt={4}>
            <Televersements organisme={myOrganisme} />
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageImportEffectifsDeMonOrganisme);
