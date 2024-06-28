import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import UnauthorizedPage from "@/components/Page/UnauthorizedPage";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";

import ListeTransmissionsPage from "../modules/transmissions/ListeTransmissionsPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageTransmissionsDeMonOrganismes = () => {
  const { organisme, isLoading, error } = useOrganisationOrganisme();

  if (isLoading) {
    return <></>;
  }

  if (!organisme || error) {
    return <UnauthorizedPage />;
  }

  return <ListeTransmissionsPage organisme={organisme} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes);
