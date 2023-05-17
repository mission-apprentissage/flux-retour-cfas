import { Box, Flex } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import ConfigurationERP from "@/modules/mon-compte/ConfigurationERP";
import NavigationCompte from "@/modules/mon-compte/NavigationCompte";
import { useOrganismeApiKey } from "@/modules/mon-compte/useApiKeyOrganisme";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ConfigurationErpPage = () => {
  const { organisme } = useEffectifsOrganismeOrganisation();
  const { data: apiKey, generateApiKey } = useOrganismeApiKey(organisme?._id);

  return (
    <Page>
      <Head>
        <title>Paramétrage  ERP</title>
      </Head>
      <Flex>
        <NavigationCompte />
        <Box w="100%" pt={[4, 8]} mb={5}>
          {organisme && (
            <ConfigurationERP
              apiKey={apiKey}
              onGenerate={() => {
                generateApiKey();
              }}
            />
          )}
        </Box>
      </Flex>
    </Page>
  );
};

export default withAuth(ConfigurationErpPage);
