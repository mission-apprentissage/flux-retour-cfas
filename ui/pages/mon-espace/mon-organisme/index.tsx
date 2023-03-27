import React, { ReactElement } from "react";
import { Stack, Heading, Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEspace } from "@/hooks/useEspace";
import OrganismeInfo from "@/modules/mon-espace/landing/LandingOrganisme/components/OrganismeInfo";
import ViewSelection from "@/modules/mon-espace/landing/visualiser-les-indicateurs/ViewSelection";
import Page from "@/components/Page/Page";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import withAuth from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import { OrganisationType } from "@/common/internal/Organisation";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const getDashboardComponents = (organisationType: OrganisationType): ReactElement => {
  switch (organisationType) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      return (
        <Stack spacing="2w">
          <Heading textStyle="h2" color="grey.800">
            Bienvenue sur votre tableau de bord
          </Heading>
          <OrganismeInfo organisme={myOrganisme} isMine={true} />
        </Stack>
      );
    }

    case "TETE_DE_RESEAU":
    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return <ViewSelection />;
  }
};

const PageMonOrganisme = () => {
  const { myOrganisme } = useEspace();
  const { organisationType } = useAuth();
  const title = "Tableau de bord";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={[PAGES.monEspace(), { title }]} />

          {/* Landing page tableau de bord de chaque utilisateur */}
          {/* On affiche les bons écrans / composants selon le type d'organisation */}
          {getDashboardComponents(organisationType)}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageMonOrganisme);
