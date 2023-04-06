import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import Televersements from "@/modules/mon-espace/effectifs/Televersements";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageImportEffectifsDeMonOrganisme = () => {
  const title = "Import";

  const { organisme } = useEffectifsOrganismeOrganisation();

  return (
    <Page>
      <Head>
        <title>Mes effectifs - {title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl">{organisme && <Televersements organisme={organisme} />}</Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageImportEffectifsDeMonOrganisme);
