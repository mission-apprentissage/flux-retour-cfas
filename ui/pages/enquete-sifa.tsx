import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import SIFAPage from "@/modules/mon-espace/SIFA/SIFAPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEnqueteSIFADeMonOrganisme = () => {
  const title = "Mon enquête SIFA";

  const { organisme } = useEffectifsOrganismeOrganisation();

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          {organisme && <SIFAPage isMine />}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageEnqueteSIFADeMonOrganisme, ["ORGANISME_FORMATION"]);
