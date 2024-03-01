import { useRouter } from "next/router";
import { IOrganisationType } from "shared";

import useAuth from "@/hooks/useAuth";

const withAuth = (Component: any, authorizedOrganisationTypes: IOrganisationType[] = []) => {
  const AuthenticatedPage = (props) => {
    const router = useRouter();
    const { auth, organisationType } = useAuth();
    if (!auth) {
      if (typeof window !== "undefined") {
        router.push("/auth/connexion");
      }
      return <></>;
    }

    if (authorizedOrganisationTypes.length > 0 && !authorizedOrganisationTypes.includes(organisationType)) {
      if (typeof window !== "undefined") {
        console.error(`Vous n'avez pas les droits pour accéder à cette page`);
        router.push("/auth/connexion");
      }
      return <></>;
    }

    return <Component {...props} />;
  };

  return AuthenticatedPage;
};

export default withAuth;
