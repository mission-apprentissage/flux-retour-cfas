import { stateToQueryString } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

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
    pathname: "/par-organisme",
    search: queryString,
  });
};
