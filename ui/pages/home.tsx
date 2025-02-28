import { IOrganisationType } from "shared";

import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import DashboardMissionLocale from "@/modules/dashboard/DashboardMissionLocale";
import DashboardOrganisme from "@/modules/dashboard/DashboardOrganisme";
import DashboardTransverse from "@/modules/dashboard/DashboardTransverse";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function DashboardOwnOrganisme() {
  const { organisme } = useOrganisationOrganisme();
  return <DashboardOrganisme organisme={organisme} modePublique={false} />;
}

function getDashboardComponent(organisationType: IOrganisationType) {
  switch (organisationType) {
    case "ORGANISME_FORMATION": {
      return <DashboardOwnOrganisme />;
    }

    case "MISSION_LOCALE": {
      return <DashboardMissionLocale />;
    }

    case "TETE_DE_RESEAU":
    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return <DashboardTransverse />;
  }
}

function DashboardPage() {
  const { organisationType } = useAuth();

  return <SimplePage title="Tableau de bord de l’apprentissage">{getDashboardComponent(organisationType)}</SimplePage>;
}

export default withAuth(DashboardPage);
