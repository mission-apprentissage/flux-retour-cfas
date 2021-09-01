import PropTypes from "prop-types";
import qs from "query-string";
import { createContext, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";

import { DEFAULT_REGION } from "../../common/constants/defaultRegion";
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

const getDefaultState = () => {
  return {
    date: new Date(),
    departement: null,
    region: DEFAULT_REGION,
    formation: null,
    cfa: null,
    reseau: null,
    sousEtablissement: null,
  };
};

const isStateValid = (state) => {
  return Boolean(state.date?.getTime());
};

export const FiltersProvider = ({ children }) => {
  const history = useHistory();
  const currentQueryString = history.location.search.slice(1);

  const updateQueryStringWithState = (state) => {
    const queryString = stateToQueryString(state);
    history.push({ search: queryString });
  };

  // make sure a valid state is always set, otherwise set it to default
  const parsedStateFromQueryString = parseQueryString(currentQueryString);
  const parsedStateIsValid = isStateValid(parsedStateFromQueryString);
  const state = parsedStateIsValid ? parsedStateFromQueryString : getDefaultState();
  useEffect(() => {
    if (!parsedStateIsValid) updateQueryStringWithState(getDefaultState());
  }, [currentQueryString]);

  const setters = {
    setDate: (value) => updateQueryStringWithState(setDate(state, value)),
    setRegion: (value) => updateQueryStringWithState(setRegion(state, value)),
    setDepartement: (value) => updateQueryStringWithState(setDepartement(state, value)),
    setCfa: (value) => updateQueryStringWithState(setCfa(state, value)),
    setReseau: (value) => updateQueryStringWithState(setReseau(state, value)),
    setFormation: (value) => updateQueryStringWithState(setFormation(state, value)),
    setSousEtablissement: (value) => updateQueryStringWithState(setSousEtablissement(state, value)),
  };

  const contextValue = {
    state,
    setters,
  };

  return <FiltersContext.Provider value={contextValue}>{children}</FiltersContext.Provider>;
};

FiltersProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useFiltersContext = () => {
  return useContext(FiltersContext);
};

export const filtersPropTypes = {
  state: PropTypes.shape({
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
  }).isRequired,
};
