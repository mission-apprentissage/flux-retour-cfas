import React from "react";
import { Stack, Heading, Text, Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEspace } from "@/hooks/useEspace";
import OrganismeInfo from "@/modules/mon-espace/landing/LandingOrganisme/components/OrganismeInfo";
import { hasContextAccessTo } from "@/common/utils/rolesUtils";
import ViewSelection from "@/modules/mon-espace/landing/visualiser-les-indicateurs/ViewSelection";
import Page from "@/components/Page/Page";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import withAuth from "@/components/withAuth";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageMonOrganisme = () => {
  let { myOrganisme } = useEspace();

  return (
    <Page>
      <Head>
        <title>Tableau de bord</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace()]} />

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
              <Text marginTop="3v" fontSize="gamma" color="grey.800">
                Quelle vue souhaitez-vous afficher ?
              </Text>
              <ViewSelection />
            </>
          )}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageMonOrganisme);
