import { useRouter } from "next/router";
import { useEffect } from "react";

import { useAffelnetCount } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import VoeuxAffelnetPage from "@/modules/voeux/AffelnetPage";

const PageVoeuxAffelnet = () => {
  const { organisationType } = useAuth();
  const router = useRouter();
  const { organisme_departements } = router.query;

  const isUnauthorized = organisationType !== "DREETS" && organisationType !== "DRAFPIC";

  const { affelnetCount, isLoading, error } = useAffelnetCount(organisme_departements);

  useEffect(() => {
    if (isUnauthorized) {
      router.push("/");
    }
  }, [isUnauthorized, router]);

  if (isUnauthorized || error || !affelnetCount) {
    return null;
  }

  return <VoeuxAffelnetPage affelnetCount={affelnetCount} isLoading={isLoading} />;
};

export default PageVoeuxAffelnet;
