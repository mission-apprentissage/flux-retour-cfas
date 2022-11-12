import React from "react";

import { hasUserRoles, roles } from "../../../../common/auth/roles";
import useAuth from "../../../../common/hooks/useAuth";
import { FiltersProvider, getDefaultState } from "../FiltersContext";
import IndicateursVueOrganismePage from "./IndicateursVueOrganismePage";

const IndicateursVueOrganismePageContainer = () => {
  const { auth } = useAuth();

  if (hasUserRoles(auth, roles.network)) {
    const fixedFiltersState = { reseau: { nom: auth.network } };
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
