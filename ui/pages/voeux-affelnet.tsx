import { useRouter } from "next/router";
import { useEffect } from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import withAuth from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import VoeuxAffelnetPage from "@/modules/voeux/AffelnetPage";

export const getServerSideProps = async (context) => ({
  props: { ...(await getAuthServerSideProps(context)) },
});

const PageVoeuxAffelnet = () => {
  const { organisationType } = useAuth();
  const router = useRouter();

  const isUnauthorized = organisationType !== "DREETS" && organisationType !== "DRAFPIC";

  useEffect(() => {
    if (isUnauthorized) {
      router.push("/");
    }
  }, [isUnauthorized, router]);

  if (isUnauthorized) {
    return null;
  }

  return <VoeuxAffelnetPage />;
};

export default withAuth(PageVoeuxAffelnet);
