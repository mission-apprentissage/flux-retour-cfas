import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";

import { Breadcrumb, PAGES } from "@/components/Breadcrumb/Breadcrumb";
import { Page } from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useOrganisme } from "@/hooks/useOrganisme";
import { hasContextAccessTo } from "@/common/utils/rolesUtils";
import EffectifsPage from "@/modules/mon-espace/effectifs/EffectifsPage";
import RibbonsUnauthorizedAccessToOrganisme from "@/components/Ribbons/RibbonsUnauthorizedAccessToOrganisme";
import RibbonsOrganismeNotFound from "@/components/Ribbons/RibbonsOrganismeNotFound";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeMonOrganisme = () => {
  const router = useRouter();
  const { organisme, isloaded } = useOrganisme(router.query.id);
  const { title } = PAGES.sesEffectifs(organisme?._id);

  console.log("router.query.id", { id: router.query.id, organisme });
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace(), { title }]} />
          <Box mt={4}>
            {organisme ? (
              hasContextAccessTo(organisme, "organisme/page_effectifs") ? (
                <EffectifsPage isMine={false} />
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

export default withAuth(PageEffectifsDeMonOrganisme);
