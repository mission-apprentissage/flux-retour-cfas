import { useRouter } from "next/router";

import withAuth from "@/components/withAuth";
import AdminListeTransmissionsParOrganisme from "@/modules/admin/transmissions/AdminListeTransmissionsParOrganisme";

const PageTransmissionsDeMonOrganismes = () => {
  const router = useRouter();

  const date = router.query.date as string;

  if (!date) {
    return <></>;
  }
  return <AdminListeTransmissionsParOrganisme date={date} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes, ["ADMINISTRATEUR"]);
