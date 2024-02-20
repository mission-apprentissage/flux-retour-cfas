import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";

import ListeTransmissionsDetails from "../../modules/transmissions/ListeTransmissionsDetails";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageTransmissionsDeMonOrganismes = () => {
  const { organisme } = useOrganisationOrganisme();
  const router = useRouter();

  const date = router.query.date as string;

  if (!organisme) {
    return <></>;
  }

  return <ListeTransmissionsDetails organisme={organisme} date={date} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes);
