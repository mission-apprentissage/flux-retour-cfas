import React from "react";

import { FiltersProvider, getDefaultState } from "../FiltersContext";
import IndicateursVueReseauPage from "./IndicateursVueReseauPage";
import useAuth from "@/hooks/useAuth";

const IndicateursVueReseauPageContainer = () => {
  const { auth } = useAuth();
  if (auth?.roles?.includes("reseau_of")) {
    const fixedFiltersState = { reseau: { nom: auth.reseau } };
    const defaultFiltersState = { ...getDefaultState(), ...fixedFiltersState };
    return (
      <FiltersProvider defaultState={defaultFiltersState} fixedState={fixedFiltersState}>
        <IndicateursVueReseauPage userLoggedAsReseau />
      </FiltersProvider>
    );
  }

  return (
    <FiltersProvider>
      <IndicateursVueReseauPage />
    </FiltersProvider>
  );
};

export default IndicateursVueReseauPageContainer;
