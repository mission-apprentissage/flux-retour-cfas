import React from "react";

import IndicateursVueOrganismePage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-organisme/IndicateursVueOrganismePage";
import useAuth from "@/hooks/useAuth";
import {
  FiltersProvider,
  getDefaultState,
} from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import withAuth from "@/components/withAuth";
import { OrganisationTeteReseau } from "@/common/internal/Organisation";

const IndicateursVueOrganismePageContainer = () => {
  const { auth, organisationType } = useAuth();
  if (organisationType === "TETE_DE_RESEAU") {
    const fixedFiltersState = { reseau: { nom: (auth.organisation as OrganisationTeteReseau).reseau } };
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
