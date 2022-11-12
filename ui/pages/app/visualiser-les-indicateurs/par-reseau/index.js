import React from "react";

import { hasUserRoles, roles } from "../../../../common/auth/roles";
import useAuth from "../../../../common/hooks/useAuth";
import { FiltersProvider, getDefaultState } from "../FiltersContext";
import IndicateursVueReseauPage from "./IndicateursVueReseauPage";

const IndicateursVueReseauPageContainer = () => {
  const { auth } = useAuth();

  if (hasUserRoles(auth, roles.network)) {
    const fixedFiltersState = { reseau: { nom: auth.network } };
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
