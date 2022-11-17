import { stateToQueryString } from "../../components/_pagesComponents/FiltersContext.js";
import { NAVIGATION_PAGES } from "../constants/navigationPages";

export const navigateToOrganismePage = (history, organisme) => {
  const { nom_etablissement, uai_etablissement } = organisme;
  const queryString = stateToQueryString({
    date: new Date(),
    cfa: {
      nom_etablissement,
      uai_etablissement,
    },
  });
  history.push({
    pathname: NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.path,
    search: queryString,
  });
};
