import React from "react";
import { Box, Container, Stack, Heading } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";

import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useOrganisme } from "@/hooks/useOrganisme";
import OrganismeInfo from "@/modules/mon-espace/landing/LandingOrganisme/components/OrganismeInfo";
import { hasContextAccessTo } from "@/common/utils/rolesUtils";
import Dashboard from "@/modules/mon-espace/landing/Dashboard";
import RibbonsUnauthorizedAccessToOrganisme from "@/components/Ribbons/RibbonsUnauthorizedAccessToOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Organisme = () => {
  const router = useRouter();
  const { organisme } = useOrganisme(router.query.id);

  return (
    <Page>
      <Head>
        <title>Tableau de bord {organisme?.enseigne || organisme?.raison_sociale}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace()]} />

          <Box mt={4}>
            {organisme ? (
              hasContextAccessTo(organisme, "organisme/tableau_de_bord") ? (
                <Stack spacing="2w">
                  <Heading textStyle="h2" color="grey.800">
                    Bienvenue sur le tableau de bord de :
                  </Heading>
                  <OrganismeInfo organisme={organisme} isMine={true} />
                </Stack>
              ) : (
                <RibbonsUnauthorizedAccessToOrganisme />
              )
            ) : (
              <Dashboard />
            )}
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(Organisme);
