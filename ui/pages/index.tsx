import React from "react";
import Head from "next/head";
import { Box, Container } from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import { OrganisationType } from "@/common/internal/Organisation";
import DashboardOrganisme from "@/modules/mon-espace/landing/DashboardOrganisme";
import DashboardTransverse from "@/modules/mon-espace/landing/DashboardTransverse";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import useAuth from "@/hooks/useAuth";
import PublicLandingPage from "@/modules/PublicLandingPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function getDashboardComponent(organisationType: OrganisationType) {
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
}

function DashboardPage() {
  const { organisationType } = useAuth();
  const title = "Tableau de bord";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          {/* Landing page tableau de bord de chaque utilisateur */}
          {/* On affiche les bons écrans / composants selon le type d'organisation */}
          {getDashboardComponent(organisationType)}
        </Container>
      </Box>
    </Page>
  );
}

export default function Home() {
  const { auth } = useAuth();
  // FIXME vérifier le chargement
  return auth ? <DashboardPage /> : <PublicLandingPage />;
}
