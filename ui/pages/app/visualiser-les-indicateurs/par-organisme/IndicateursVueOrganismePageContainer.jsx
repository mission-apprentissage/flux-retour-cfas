import React from "react";

import { hasUserRoles, roles } from "../../../../common/auth/roles";
import { FiltersProvider, getDefaultState } from "../../../../components/_pagesComponents/FiltersContext.js";
import useAuth from "../../../../hooks/useAuth";
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
