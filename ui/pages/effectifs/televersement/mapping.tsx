import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import TeleversementsMapping from "@/modules/mon-espace/effectifs/TeleversementsMapping";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageImportEffectifsDeMonOrganismeMapping = () => {
  const { organisme } = useEffectifsOrganismeOrganisation();
  return (
    <Page>
      <Head>
        <title>Mes effectifs - Mapping</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl">
          {organisme && (
            <pre>
              <TeleversementsMapping organisme={organisme} />
            </pre>
          )}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageImportEffectifsDeMonOrganismeMapping);
