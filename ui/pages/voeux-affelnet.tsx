import { useRouter } from "next/router";
import { useEffect } from "react";
import { ORGANISATION_TYPE } from "shared";

import useAuth from "@/hooks/useAuth";
import VoeuxAffelnetPage from "@/modules/voeux/AffelnetPage";

const PageVoeuxAffelnet = () => {
  const { organisationType } = useAuth();
  const router = useRouter();

  const isUnauthorized = organisationType !== ORGANISATION_TYPE.ACADEMIE;

  useEffect(() => {
    if (isUnauthorized) {
      router.push("/home");
    }
  }, [isUnauthorized, router]);

  if (isUnauthorized) {
    return null;
  }

  return <VoeuxAffelnetPage />;
};

export default PageVoeuxAffelnet;
