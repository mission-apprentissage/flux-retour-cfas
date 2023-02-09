import React from "react";
import { Box, Container, Stack, Heading } from "@chakra-ui/react";
import Head from "next/head";

import { Breadcrumb, PAGES } from "@/components/Breadcrumb/Breadcrumb";
import { Page } from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEspace } from "@/hooks/useEspace";
import OrganismeInfo from "@/modules/mon-espace/landing/LandingOrganisme/components/OrganismeInfo";
import { hasContextAccessTo } from "@/common/utils/rolesUtils";
import LandingErp from "@/modules/mon-espace/landing/LandingErp";
import LandingTransverse from "@/modules/mon-espace/landing/LandingTransverse";
import LandingReseau from "@/modules/mon-espace/landing/LandingReseau.jsx";
import LandingPilot from "@/modules/mon-espace/landing/LandingPilot.jsx";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageMonOrganisme = () => {
  let { myOrganisme, whoIs } = useEspace();

  return (
    <Page>
      <Head>
        <title>Tableau de bord</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace()]} />

          <Box mt={4}>
            {myOrganisme ? (
              hasContextAccessTo(myOrganisme, "organisme/tableau_de_bord") && (
                <Stack spacing="2w">
                  <Heading textStyle="h2" color="grey.800">
                    Bienvenue sur votre tableau de bord
                  </Heading>
                  <OrganismeInfo organisme={myOrganisme} isMine={true} />
                </Stack>
              )
            ) : (
              <>
                {whoIs === "reseau_of" && <LandingReseau />}
                {whoIs === "pilot" && <LandingPilot />}
                {whoIs === "erp" && <LandingErp />}
                {!whoIs && <LandingTransverse />}
              </>
            )}
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageMonOrganisme);
