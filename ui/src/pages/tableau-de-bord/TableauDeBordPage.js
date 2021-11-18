import React from "react";

import { getAuthUserNetwork, getAuthUserRole } from "../../common/auth/auth";
import { roles } from "../../common/auth/roles";
import { DEFAULT_REGION } from "../../common/constants/defaultRegion";
import { FiltersProvider, useFiltersContext } from "./FiltersContext";
import useEffectifs from "./useEffectifs";
import { CfaView, DepartementView, FormationView, RegionView, ReseauView } from "./views";

export const TableauDeBordView = () => {
  const [effectifs, loading, error] = useEffectifs();
  const { state: filters } = useFiltersContext();

  if (filters.cfa) {
    return (
      <CfaView
        cfaUai={filters.cfa.uai_etablissement}
        filters={filters}
        effectifs={effectifs}
        loading={loading}
        error={error}
      />
    );
  }

  if (filters.formation) {
    return (
      <FormationView formationCfd={filters.formation.cfd} loading={loading} filters={filters} effectifs={effectifs} />
    );
  }

  if (filters.reseau) {
    return <ReseauView effectifs={effectifs} loading={loading} filters={filters} reseau={filters.reseau.nom} />;
  }

  if (filters.region) {
    return <RegionView effectifs={effectifs} loading={loading} filters={filters} />;
  }

  return <DepartementView filters={filters} effectifs={effectifs} loading={loading} error={error} />;
};

const TableauDeBordPage = () => {
  if (getAuthUserRole() === roles.network) {
    const fixedFiltersState = { reseau: { nom: getAuthUserNetwork() } };
    const defaultFiltersState = { region: DEFAULT_REGION, ...fixedFiltersState };
    return (
      <FiltersProvider defaultState={defaultFiltersState} fixedState={fixedFiltersState}>
        <TableauDeBordView />
      </FiltersProvider>
    );
  }

  return (
    <FiltersProvider defaultState={{ region: DEFAULT_REGION }}>
      <TableauDeBordView />
    </FiltersProvider>
  );
};

export default TableauDeBordPage;
