import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

export const organisationTypes = [
  "ORGANISME_FORMATION_FORMATEUR",
  "ORGANISME_FORMATION_REPONSABLE",
  "ORGANISME_FORMATION_REPONSABLE_FORMATEUR",
  "TETE_DE_RESEAU",
  "DGEFP",
  "DREETS",
  "DEETS",
  "DRAAF",
  "CONSEIL_REGIONAL",
  "DDETS",
  "ACADEMIE",
  "ADMINISTRATEUR",
] as const;

const withAuth = (Component: any, authorizedOrganisationTypes: (typeof organisationTypes)[number][] = []) => {
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
