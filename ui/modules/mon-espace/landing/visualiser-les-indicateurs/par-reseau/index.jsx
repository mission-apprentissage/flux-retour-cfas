import React from "react";

import { getAuthUserNetwork, getAuthUserRole } from "@/common/auth/auth";
import { roles } from "@/common/auth/roles";
import { FiltersProvider, getDefaultState } from "../FiltersContext";
import IndicateursVueReseauPage from "./IndicateursVueReseauPage";

const IndicateursVueReseauPageContainer = () => {
  if (getAuthUserRole() === roles.network) {
    const fixedFiltersState = { reseau: { nom: getAuthUserNetwork() } };
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
