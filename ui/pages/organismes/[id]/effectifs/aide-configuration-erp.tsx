import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import ConfigurationAPI from "@/modules/mon-espace/effectifs/ConfigurationAPI";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import { useRouter } from "next/router";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageAideConfigurationErpSonOrganisme = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganisme(router.query.id as string);
  return (
    <Page>
      <Head>
        <title>Configuration ERP</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          {organisme && <ConfigurationAPI organisme={organisme} isMine={false} />}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageAideConfigurationErpSonOrganisme);
