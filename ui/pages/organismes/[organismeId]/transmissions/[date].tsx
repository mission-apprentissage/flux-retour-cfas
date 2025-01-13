import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import UnauthorizedPage from "@/components/Page/UnauthorizedPage";
import withAuth from "@/components/withAuth";
import { useOrganisme } from "@/hooks/organismes";

import ListeTransmissionsDetails from "../../../../modules/transmissions/ListeTransmissionsDetails";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageTransmissionsDeMonOrganismes = () => {
  const router = useRouter();
  const { organisme } = useOrganisme(router.query.organismeId as string);

  const date = router.query.date as string;

  if (!organisme) {
    return <UnauthorizedPage />;
  }

  return <ListeTransmissionsDetails organisme={organisme} date={date} modePublique={true} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes);
