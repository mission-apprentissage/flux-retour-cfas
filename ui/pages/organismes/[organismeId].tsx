import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useOrganisme } from "@/hooks/organismes";
import DashboardOrganisme from "@/modules/dashboard/DashboardOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const DashboardPubliqueOrganisme = () => {
  const router = useRouter();
  const { organisme } = useOrganisme(router.query.organismeId as string);

  return (
    <SimplePage title={`Tableau de bord ${organisme?.enseigne || organisme?.raison_sociale || ""}`}>
      {organisme && <DashboardOrganisme organisme={organisme} modePublique={true} />}
    </SimplePage>
  );
};

export default withAuth(DashboardPubliqueOrganisme);
