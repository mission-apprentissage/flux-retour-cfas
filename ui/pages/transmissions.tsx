import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";

import ListeTransmissionsPage from "../modules/transmissions/ListeTransmissionsPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageTransmissionsDeMonOrganismes = () => {
  const { organisme } = useOrganisationOrganisme();

  if (!organisme) {
    return <></>;
  }

  return <ListeTransmissionsPage organisme={organisme} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes);
