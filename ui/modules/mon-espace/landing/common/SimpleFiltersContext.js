import { createContext, useContext, useEffect, useState } from "react";
import queryString from "query-string";
import { omitNullishValues } from "@/common/utils/omitNullishValues";
import { DEPARTEMENTS_BY_ID } from "@/common/constants/territoiresConstants";

const SimpleFiltersContext = createContext();

export const exportFiltersToQueryString = (filters) => {
  return queryString.stringify(
    omitNullishValues({
      date: filters.date.toISOString(),
      departement: filters.departement?.code,
      region: filters.region?.code,
      // formation: filters.formation ? JSON.stringify(filters.formation) : null,
      // cfa: filters.cfa ? JSON.stringify(filters.cfa) : null,
      // reseau: filters.reseau ? JSON.stringify(filters.reseau) : null,
      // sousEtablissement: filters.sousEtablissement ? JSON.stringify(filters.sousEtablissement) : null,
    })
  );
};

const parseQueryString = (filtersString) => {
  const parsedFilters = queryString.parse(filtersString);
  return {
    date: new Date(parsed.date),
    departement: DEPARTEMENTS_BY_ID[parsedFilters.departement],
    region: DEPARTEMENTS_BY_ID[parsedFilters.region],
    // formation: parsed.formation ? JSON.parse(parsed.formation) : null,
    // cfa: parsed.cfa ? JSON.parse(parsed.cfa) : null,
    // reseau: parsed.reseau ? JSON.parse(parsed.reseau) : null,
    // sousEtablissement: parsed.sousEtablissement ? JSON.parse(parsed.sousEtablissement) : null,
  };
};

export const getDefaultState = () => ({
  date: new Date(),
  organismeId: null,
  departement: null,
  region: null,
  // formation: null,
  // cfa: null,
  // reseau: null,
  // sousEtablissement: null,
});

const updateUrlWithState = (state) => {
  // in some cases, we want some fields in the state to never change (network for a network user for example)
  const newState = { ...state, ...fixedState };
  // serialize state to url query string
  const queryString = stateToQueryString(newState);
  router.push({ search: queryString });
};

/**
 * Todo voir ou placer / comment gérer ce contexte
 * @param {*} param0
 * @returns
 */
export const SimpleFiltersProvider = ({ children, initialState = null }) => {
  // const router = useRouter();

  // const updateUrlWithState = (state) => {
  //   // in some cases, we want some fields in the state to never change (network for a network user for example)
  //   const newState = { ...state, ...fixedState };
  //   // serialize state to url query string
  //   const queryString = stateToQueryString(newState);
  //   router.push({ search: queryString });
  // };

  // TODO Check all filters needed
  const [date, setDate] = useState(new Date());
  const [organismeId, setOrganismeId] = useState(null);
  const [departement, setDepartement] = useState(null);
  const [region, setRegion] = useState(null);

  // Handle initial state
  useEffect(() => {
    if (initialState?.date) setDate(initialState.date);
    if (initialState?.organismeId) setOrganismeId(initialState.organismeId);
    if (initialState?.departement) setDepartement(initialState.departement);
    if (initialState?.region) setRegion(initialState.region);
  }, [initialState]);

  const contextValue = {
    filtersValues: {
      date,
      organismeId,
      departement,
      region,
    },
    filtersSetters: {
      setDate,
      setOrganismeId,
      setDepartement: (value) => {
        setDepartement(value);
        setRegion();
      },
      setRegion: (value) => {
        setRegion(value);
        setDepartement();
      },
      resetTerritoire: () => {
        setDepartement();
        setRegion();
      },
    },
  };

  return <SimpleFiltersContext.Provider value={contextValue}>{children}</SimpleFiltersContext.Provider>;
};

export const useSimpleFiltersContext = () => useContext(SimpleFiltersContext);
