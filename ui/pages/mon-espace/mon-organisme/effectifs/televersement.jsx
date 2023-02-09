import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import { Breadcrumb, PAGES } from "@/components/Breadcrumb/Breadcrumb";
import { Page } from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEspace } from "@/hooks/useEspace";
import { hasContextAccessTo } from "@/common/utils/rolesUtils";
import Televersements from "@/modules/mon-espace/effectifs/Televersements";
import RibbonsUnauthorizedAccessToOrganisme from "@/components/Ribbons/RibbonsUnauthorizedAccessToOrganisme";
import RibbonsOrganismeNotFound from "@/components/Ribbons/RibbonsOrganismeNotFound";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageImportEffectifsDeMonOrganisme = () => {
  let { myOrganisme, isloaded } = useEspace();

  const title = "Import";

  return (
    <Page>
      <Head>
        <title>Mon espace</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace(), PAGES.mesEffectifs(), { title }]} />
          <Box mt={4}>
            {myOrganisme ? (
              hasContextAccessTo(myOrganisme, "organisme/page_effectifs") ? (
                <Televersements organisme={myOrganisme} />
              ) : (
                <RibbonsUnauthorizedAccessToOrganisme mt="0.5rem" />
              )
            ) : isloaded ? (
              <RibbonsOrganismeNotFound mt="0.5rem" />
            ) : null}
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageImportEffectifsDeMonOrganisme);
