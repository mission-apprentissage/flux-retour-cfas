import React, { ReactElement } from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import withAuth from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import { OrganisationType } from "@/common/internal/Organisation";
import DashboardOrganisme from "@/modules/mon-espace/landing/DashboardOrganisme";
import DashboardTransverse from "@/modules/mon-espace/landing/DashboardTransverse";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const getDashboardComponent = (organisationType: OrganisationType): ReactElement => {
  switch (organisationType) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      return <DashboardOrganisme />;
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
      // fourre-tout, mais on pourra avoir des différences plus tard
      return <DashboardTransverse />;
  }
};

const PageMonOrganisme = () => {
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
          {getDashboardComponent(organisationType)}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageMonOrganisme);
