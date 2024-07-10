import { useRouter } from "next/router";
import { useEffect } from "react";

import useAuth from "@/hooks/useAuth";
import VoeuxAffelnetPage from "@/modules/voeux/AffelnetPage";

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

export default PageVoeuxAffelnet;
