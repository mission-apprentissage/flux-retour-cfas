import { Box, Flex } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { useOrganisme } from "@/hooks/organismes";
import ConfigurationERP from "@/modules/mon-compte/ConfigurationERP";
import NavigationCompte from "@/modules/mon-compte/NavigationCompte";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ConfigurationErpPage = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganismeOrganisation();
  const { organisme: currentOrganisme, generateApiKey, isGeneratingApiKey } = useOrganisme(organisme?._id);

  return (
    <Page>
      <Head>
        <title>Paramétrage ERP</title>
      </Head>
      <Flex>
        <NavigationCompte />
        <Box w="100%" pt={[4, 8]} mb={5}>
          {currentOrganisme && (
            <ConfigurationERP
              organisme={currentOrganisme}
              erp={router.query.erp}
              isGenerating={isGeneratingApiKey}
              onGenerate={() => generateApiKey()}
            />
          )}
        </Box>
      </Flex>
    </Page>
  );
};

export default withAuth(ConfigurationErpPage);
