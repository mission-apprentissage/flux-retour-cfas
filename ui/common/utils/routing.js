import { stateToQueryString } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { NAVIGATION_PAGES } from "../constants/navigationPages";

export const navigateToOrganismePage = (router, organisme) => {
  const { nom_etablissement, uai_etablissement } = organisme;
  const queryString = stateToQueryString({
    date: new Date(),
    cfa: {
      nom_etablissement,
      uai_etablissement,
    },
  });
  router.push({
    pathname: NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.path,
    search: queryString,
  });
};
