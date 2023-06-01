import Head from "next/head";
import React from "react";

import { OrganisationType } from "@/common/internal/Organisation";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import useAuth from "@/hooks/useAuth";
import NewDashboardTransverse from "@/modules/dashboard/NewDashboardTransverse";
import DashboardOrganisme from "@/modules/mon-espace/landing/DashboardOrganisme";
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
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      // fourre-tout, mais on pourra avoir des différences plus tard
      return <NewDashboardTransverse />;
  }
}

function DashboardPage() {
  const { organisationType } = useAuth();

  return (
    <SimplePage>
      <Head>
        <title>Tableau de bord</title>
      </Head>
      {getDashboardComponent(organisationType)}
    </SimplePage>
  );
}

export default function Home() {
  const { auth } = useAuth();
  // FIXME vérifier le chargement
  return auth ? <DashboardPage /> : <PublicLandingPage />;
}
