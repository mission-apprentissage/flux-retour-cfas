import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import EffectifsDoublonsPage from "@/modules/mon-espace/effectifs/doublons/EffectifsDoublonsPage";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageDoublonsDeSonOrganisme = () => {
  const { organisme } = useEffectifsOrganismeOrganisation();

  return (
    <Page>
      <Head>
        <title>Ses doublons</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          {organisme && <EffectifsDoublonsPage isMine={true} />}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageDoublonsDeSonOrganisme);
