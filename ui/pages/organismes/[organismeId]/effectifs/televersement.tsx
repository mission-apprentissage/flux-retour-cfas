import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import Televersements from "@/modules/mon-espace/effectifs/Televersements";
import { useRouter } from "next/router";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageImportEffectifsDeSonOrganisme = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganisme(router.query.organismeId as string);
  return (
    <Page>
      <Head>
        <title>Ses effectifs - Import</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl">{organisme && <Televersements organisme={organisme} />}</Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageImportEffectifsDeSonOrganisme);
