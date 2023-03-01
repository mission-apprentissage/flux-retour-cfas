import React from "react";

import IndicateursVueOrganismePage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-organisme/IndicateursVueOrganismePage";
import useAuth from "@/hooks/useAuth";
import {
  FiltersProvider,
  getDefaultState,
} from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import withAuth from "@/components/withAuth";

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

export default withAuth(IndicateursVueOrganismePageContainer);
