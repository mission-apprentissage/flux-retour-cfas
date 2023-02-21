import React from "react";

import { roles } from "@/common/auth/roles";
import IndicateursVueOrganismePage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-organisme/IndicateursVueOrganismePage";
import useAuth from "@/hooks/useAuth";
import {
  FiltersProvider,
  getDefaultState,
} from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

const IndicateursVueOrganismePageContainer = () => {
  const [auth] = useAuth();
  if (auth?.roles?.includes(roles.network)) {
    // FIXME retrieve the user network
    const fixedFiltersState = { reseau: { nom: "[FIXME] NOM RESEAU" } };
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
