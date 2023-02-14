import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEspace } from "@/hooks/useEspace";
import { hasContextAccessTo } from "@/common/utils/rolesUtils";
import ParametresOrganisme from "@/modules/mon-espace/parametres/parametresOrganisme";
import RibbonsUnauthorizedAccessToOrganisme from "@/components/Ribbons/RibbonsUnauthorizedAccessToOrganisme";
import RibbonsOrganismeNotFound from "@/components/Ribbons/RibbonsOrganismeNotFound";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageParametresDeMonOrganisme = () => {
  let { myOrganisme, isloaded } = useEspace();
  const title = "Paramètres de mon organisme";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace(), { title }]} />

          <Box mt={4}>
            {myOrganisme ? (
              hasContextAccessTo(myOrganisme, "organisme/page_parametres") ? (
                <ParametresOrganisme organisme={myOrganisme} title="Paramètres de mon organisme" />
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

export default withAuth(PageParametresDeMonOrganisme);
