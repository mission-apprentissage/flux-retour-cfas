import { createContext, useContext, useEffect, useState } from "react";

const SimpleFiltersContext = createContext();

/**
 * Todo voir ou placer / comment gérer ce contexte
 * @param {*} param0
 * @returns
 */
export const SimpleFiltersProvider = ({ children, initialState = null }) => {
  // TODO Check all filters needed
  const [date, setDate] = useState(new Date());
  const [organismeId, setOrganismeId] = useState("");

  // Handle initial state
  useEffect(() => {
    if (initialState?.date) setDate(initialState.date);
    if (initialState?.organismeId) setOrganismeId(initialState.organismeId);
  }, [initialState]);

  const contextValue = {
    filtersValues: { date, organismeId },
    filtersSetters: { setDate, setOrganismeId },
  };

  return <SimpleFiltersContext.Provider value={contextValue}>{children}</SimpleFiltersContext.Provider>;
};

export const useSimpleFiltersContext = () => useContext(SimpleFiltersContext);
