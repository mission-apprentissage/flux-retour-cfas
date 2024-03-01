import { useRouter } from "next/router";
import { IOrganisationType } from "shared";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import useAuth from "@/hooks/useAuth";

const withAuth = (Component: any, authorizedOrganisationTypes: IOrganisationType[] = []) => {
  const AuthenticatedPage = (props) => {
    const [_, setOriginConnexionUrl] = useLocalStorage("originConnexionUrl", "");
    const [canDisplay, setCanDisplay] = useState(false);

    const router = useRouter();
    const { auth, organisationType } = useAuth();

    useEffect(() => {
      if (!auth && typeof window !== "undefined" && !authorizedOrganisationTypes.includes(organisationType)) {
        setOriginConnexionUrl(router.asPath);
        router.push("/auth/connexion");
        return;
      }

      setCanDisplay(true);
    }, [auth, organisationType]);

    return canDisplay && <Component {...props} />;
  };

  return AuthenticatedPage;
};

export default withAuth;
