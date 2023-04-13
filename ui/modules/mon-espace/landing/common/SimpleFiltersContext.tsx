import { createContext, useContext, useEffect, useState } from "react";

const SimpleFiltersContext = createContext({});

/**
 * Todo voir ou placer / comment gérer ce contexte
 * @param {*} param0
 * @returns
 */
export const SimpleFiltersProvider = ({ children, initialState = null }: { children: any; initialState?: any }) => {
  // TODO Check all filters needed
  const [date, setDate] = useState(new Date());

  // Handle initial state
  useEffect(() => {
    if (initialState?.date) setDate(initialState.date);
  }, [initialState]);

  const contextValue = {
    filtersValues: { date },
    filtersSetters: { setDate },
  };

  return <SimpleFiltersContext.Provider value={contextValue}>{children}</SimpleFiltersContext.Provider>;
};

export const useSimpleFiltersContext = () => useContext<any>(SimpleFiltersContext);
