import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import UnauthorizedPage from "@/components/Page/UnauthorizedPage";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";

import ListeTransmissionsPage from "../modules/transmissions/ListeTransmissionsPage";

export const getServerSideProps = async (context) => {
  const authProps = await getAuthServerSideProps(context, false);
  const organisme = authProps?.auth?.organisation?.organisme_id || null;

  if (!organisme) {
    return {
      redirect: {
        destination: "/home",
        permanent: false,
      },
    };
  }

  return { props: { ...authProps } };
};

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
