import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import ConfigurationAPI from "@/modules/mon-espace/effectifs/ConfigurationAPI";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageAideConfigurationErpSonOrganisme = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganisme(router.query.organismeId as string);

  const erpIdSelected = router.query.erp;

  return (
    <Page>
      <Head>
        <title>Configuration ERP</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          {organisme && <ConfigurationAPI organismeId={organisme._id} isMine={false} erpIdSelected={erpIdSelected} />}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageAideConfigurationErpSonOrganisme);
