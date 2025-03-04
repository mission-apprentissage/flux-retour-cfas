import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import UnauthorizedPage from "@/components/Page/UnauthorizedPage";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";

import ListeTransmissionsDetails from "../../modules/transmissions/ListeTransmissionsDetails";

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
  const { organisme } = useOrganisationOrganisme();
  const router = useRouter();

  const date = router.query.date as string;

  if (!organisme) {
    return <UnauthorizedPage />;
  }

  return <ListeTransmissionsDetails organisme={organisme} date={date} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes);
