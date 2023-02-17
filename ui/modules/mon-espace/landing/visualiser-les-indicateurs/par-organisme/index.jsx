import React from "react";

import { getAuthUserNetwork, getAuthUserRole } from "@/common/auth/auth";
import { roles } from "@/common/auth/roles";
import { FiltersProvider, getDefaultState } from "../FiltersContext";
import IndicateursVueOrganismePage from "./IndicateursVueOrganismePage";

const IndicateursVueOrganismePageContainer = () => {
  if (getAuthUserRole() === roles.network) {
    const fixedFiltersState = { reseau: { nom: getAuthUserNetwork() } };
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
