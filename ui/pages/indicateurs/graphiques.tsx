import { sign } from "jsonwebtoken";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

import { AuthContext } from "@/common/internal/AuthContext";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import withAuth from "@/components/withAuth";
import OngletsIndicateurs from "@/modules/indicateurs/OngletsIndicateurs";
import { canViewOngletIndicateursVueGraphique } from "@/modules/indicateurs/permissions-onglet-graphique";

/**
 * Signature de l'iframe Metabase avec un secret côté serveur uniquement pour sécuriser l'intégration
 * et éviter que quelqu'un puisse changer les paramètres.
 */
export const getServerSideProps: GetServerSideProps<{
  iframeUrl?: string;
  auth?: AuthContext;
  error?: string;
}> = async (context) => {
  const { auth } = (await getAuthServerSideProps(context, false)) as { auth: AuthContext };
  if (!auth || !canViewOngletIndicateursVueGraphique(auth?.organisation?.type)) {
    return {
      props: { error: "Vous n'avez pas les permissions" },
    };
  }

  const METABASE_SITE_URL = process.env.METABASE_SITE_URL;
  const METABASE_ONGLET_DATAVIZ_DASHBOARD_ID = parseInt(process.env.METABASE_ONGLET_DATAVIZ_DASHBOARD_ID ?? "0");
  const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY ?? "invalid key"; // will trigger an error

  const payload = {
    resource: { dashboard: METABASE_ONGLET_DATAVIZ_DASHBOARD_ID },
    params: {
      region: (auth.organisation as any).code_region ?? [],
      departement: (auth.organisation as any).code_departement ?? [],
      academie: (auth.organisation as any).code_academie ?? [],
    },
    exp: Math.round(Date.now() / 1000) + 60 * 60, // 1 hour expiration
  };
  const token = sign(payload, METABASE_SECRET_KEY);

  const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=false&titled=false`;

  return { props: { iframeUrl, auth } };
};

function MesIndicateursGraphiquesPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <OngletsIndicateurs
      activeTab="indicateurs-graphiques"
      modePublique={false}
      error={props.error}
      iframeUrl={props.iframeUrl}
    />
  );
}

export default withAuth(MesIndicateursGraphiquesPage);
