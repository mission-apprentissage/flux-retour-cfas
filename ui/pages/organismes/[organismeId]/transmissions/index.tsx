import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import UnauthorizedPage from "@/components/Page/UnauthorizedPage";
import withAuth from "@/components/withAuth";
import { useOrganisme } from "@/hooks/organismes";

import ListeTransmissionsPage from "../../../../modules/transmissions/ListeTransmissionsPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageTransmissionsDeMonOrganismes = () => {
  const router = useRouter();
  const { organisme } = useOrganisme(router.query.organismeId as string);

  if (!organisme) {
    return <UnauthorizedPage />;
  }

  return <ListeTransmissionsPage organisme={organisme} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes);
