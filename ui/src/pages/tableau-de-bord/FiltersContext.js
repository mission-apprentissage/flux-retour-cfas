import PropTypes from "prop-types";
import qs from "query-string";
import { createContext, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";

import { omitNullishValues } from "../../common/utils/omitNullishValues";

const FiltersContext = createContext();

const setDate = (state, date) => {
  return { ...state, date };
};

const setRegion = (state, region) => {
  return { ...state, cfa: null, departement: null, sousEtablissement: null, region };
};

const setDepartement = (state, departement) => {
  return { ...state, cfa: null, region: null, sousEtablissement: null, departement };
};

const setFormation = (state, formation) => {
  return { ...state, cfa: null, reseau: null, sousEtablissement: null, formation };
};

const setCfa = (state, cfa) => {
  return { ...state, reseau: null, formation: null, sousEtablissement: null, cfa };
};

const setReseau = (state, reseau) => {
  return { ...state, cfa: null, formation: null, sousEtablissement: null, reseau };
};

const setSousEtablissement = (state, sousEtablissement) => {
  return { ...state, sousEtablissement };
};

const resetTerritoire = (state) => {
  return { ...state, departement: null, region: null };
};

const stateToQueryString = (state) => {
  return qs.stringify(
    omitNullishValues({
      departement: state.departement ? JSON.stringify(state.departement) : null,
      region: state.region ? JSON.stringify(state.region) : null,
      formation: state.formation ? JSON.stringify(state.formation) : null,
      cfa: state.cfa ? JSON.stringify(state.cfa) : null,
      reseau: state.reseau ? JSON.stringify(state.reseau) : null,
      sousEtablissement: state.sousEtablissement ? JSON.stringify(state.sousEtablissement) : null,
      date: state.date?.getTime(),
    })
  );
};

const parseQueryString = (queryString) => {
  const parsed = qs.parse(queryString);
  return {
    departement: parsed.departement ? JSON.parse(parsed.departement) : null,
    region: parsed.region ? JSON.parse(parsed.region) : null,
    formation: parsed.formation ? JSON.parse(parsed.formation) : null,
    cfa: parsed.cfa ? JSON.parse(parsed.cfa) : null,
    reseau: parsed.reseau ? JSON.parse(parsed.reseau) : null,
    sousEtablissement: parsed.sousEtablissement ? JSON.parse(parsed.sousEtablissement) : null,
    date: new Date(Number(parsed.date)),
  };
};

export const getDefaultState = () => ({
  date: new Date(),
  departement: null,
  region: null,
  formation: null,
  cfa: null,
  reseau: null,
  sousEtablissement: null,
});

const isStateValid = (state) => {
  return Boolean(state.date?.getTime());
};

export const FiltersProvider = ({ children, defaultState = {}, fixedState = {} }) => {
  const history = useHistory();
  const currentQueryString = history.location.search.slice(1);

  const updateUrlWithState = (state) => {
    // in some cases, we want some fields in the state to never change (network for a network user for example)
    const newState = { ...state, ...fixedState };
    // serialize state to url query string
    const queryString = stateToQueryString(newState);
    history.push({ search: queryString });
  };
  const initialState = { ...getDefaultState(), ...defaultState };

  // make sure a valid state is always set, otherwise set it to default
  const parsedStateFromQueryString = parseQueryString(currentQueryString);
  const parsedStateIsValid = isStateValid(parsedStateFromQueryString);
  const state = parsedStateIsValid ? parsedStateFromQueryString : initialState;
  useEffect(() => {
    if (!parsedStateIsValid) updateUrlWithState(initialState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQueryString]);

  const setters = {
    setDate: (value) => updateUrlWithState(setDate(state, value)),
    setRegion: (value) => updateUrlWithState(setRegion(state, value)),
    setDepartement: (value) => updateUrlWithState(setDepartement(state, value)),
    setCfa: (value) => updateUrlWithState(setCfa(state, value)),
    setReseau: (value) => updateUrlWithState(setReseau(state, value)),
    setFormation: (value) => updateUrlWithState(setFormation(state, value)),
    setSousEtablissement: (value) => updateUrlWithState(setSousEtablissement(state, value)),
    resetTerritoire: () => updateUrlWithState(resetTerritoire(state)),
  };

  const contextValue = {
    state,
    setters,
  };

  return <FiltersContext.Provider value={contextValue}>{children}</FiltersContext.Provider>;
};

export const useFiltersContext = () => {
  return useContext(FiltersContext);
};

export const filtersStatePropType = PropTypes.shape({
  date: PropTypes.instanceOf(Date),
  cfa: PropTypes.shape({
    uai_etablissement: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string.isRequired,
  }),
  region: PropTypes.shape({
    nom: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
  }),
  departement: PropTypes.shape({
    nom: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
  }),
  reseau: PropTypes.shape({
    nom: PropTypes.string.isRequired,
  }),
  formation: PropTypes.shape({
    cfd: PropTypes.string.isRequired,
    libelle: PropTypes.string.isRequired,
  }),
  sousEtablissement: PropTypes.shape({
    nom_etablissement: PropTypes.string,
    siret_etablissement: PropTypes.string.isRequired,
  }),
});

export const filtersPropTypes = {
  state: filtersStatePropType.isRequired,
};

FiltersProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultState: filtersStatePropType,
  fixedState: filtersStatePropType,
};
