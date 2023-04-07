import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import EffectifsPage from "@/modules/mon-espace/effectifs/EffectifsPage";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeMonOrganisme = () => {
  const title = "Mes effectifs";

  const { organisme } = useEffectifsOrganismeOrganisation();

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          {organisme && <EffectifsPage isMine={true} />}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageEffectifsDeMonOrganisme);
