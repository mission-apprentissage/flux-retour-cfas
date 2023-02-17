import React from "react";

import { roles } from "@/common/auth/roles";
import { FiltersProvider, getDefaultState } from "../FiltersContext";
import IndicateursVueReseauPage from "./IndicateursVueReseauPage";
import useAuth from "@/hooks/useAuth";

const IndicateursVueReseauPageContainer = () => {
  const [auth] = useAuth();
  if (auth?.roles?.includes(roles.network)) {
    // FIXME retrieve the user network
    const fixedFiltersState = { reseau: { nom: "[FIXME] NOM RESEAU" } };
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
