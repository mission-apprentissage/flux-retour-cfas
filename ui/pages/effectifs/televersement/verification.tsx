import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import TeleversementsVerification from "@/modules/mon-espace/effectifs/TeleversementsVerification";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageImportEffectifsDeMonOrganismeVerification = () => {
  const { organisme } = useEffectifsOrganismeOrganisation();
  return (
    <Page>
      <Head>
        <title>Mes effectifs - Verification</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl">{organisme && <TeleversementsVerification organismeId={organisme._id} />}</Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageImportEffectifsDeMonOrganismeVerification);
