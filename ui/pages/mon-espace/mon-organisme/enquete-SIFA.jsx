import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";

import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SIFAPage from "@/modules/mon-espace/SIFA/SIFAPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEnqueteSIFADeMonOrganisme = () => {
  const title = "Mon enquête SIFA";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace(), { title }]} />
          <Box mt={4}>
            <SIFAPage isMine />
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageEnqueteSIFADeMonOrganisme, [
  "ORGANISME_FORMATION_FORMATEUR",
  "ORGANISME_FORMATION_RESPONSABLE",
  "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
]);
