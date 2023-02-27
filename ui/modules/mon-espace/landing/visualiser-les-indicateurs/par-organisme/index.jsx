import React from "react";

import { FiltersProvider, getDefaultState } from "../FiltersContext";
import IndicateursVueOrganismePage from "./IndicateursVueOrganismePage";
import useAuth from "@/hooks/useAuth";

const IndicateursVueOrganismePageContainer = () => {
  const [auth] = useAuth();
  if (auth?.roles?.includes("reseau_of")) {
    const fixedFiltersState = { reseau: { nom: auth.reseau } };
    const defaultFiltersState = { ...getDefaultState(), ...fixedFiltersState };
    return (
      <FiltersProvider defaultState={defaultFiltersState} fixedState={fixedFiltersState}>
        <IndicateursVueOrganismePage userLoggedAsReseau />
      </FiltersProvider>
    );
  }

  return (
    <FiltersProvider>
      <IndicateursVueOrganismePage />
    </FiltersProvider>
  );
};

export default IndicateursVueOrganismePageContainer;
